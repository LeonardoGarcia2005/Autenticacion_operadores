// Importa las dependencias necesarias de Apollo Client
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import "./styles/Home.css";
import "./App.css";
import Login from "./page/Login";
import { ThemeContextProvider } from "./context/ThemeContext";
import Scroll from "./page/Scroll";
import { TokenVerification } from "./public/VerifyToken";
import ProtectedRouter from "./public/ProtectedRouter";

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// Crea un enlace de autenticación que agrega el token de autorización a las solicitudes
const authLink = setContext((_, { headers }) => {
  // Obtiene el token de localStorage
  const token = localStorage.getItem("token");

  // Devuelve los headers con el token de autorización agregado
  return {
    headers: {
      ...headers,
      authorization: token ? `${token}` : "",
    },
  };
});

// Crea una instancia de Apollo Client configurada con el enlace de autenticación del token y el enlace HTTP
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
function App() {
  return (
    <>
      <div>
        <ApolloProvider client={client}>
          <AuthProvider>
            <ThemeContextProvider>
              <TokenVerification />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route element={<ProtectedRouter />}>
                    <Route path="/homepage" element={<Scroll />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </ThemeContextProvider>
          </AuthProvider>
        </ApolloProvider>
      </div>
    </>
  );
}

export default App;
