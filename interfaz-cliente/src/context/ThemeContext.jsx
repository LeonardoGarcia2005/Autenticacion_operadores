import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

export const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
  const [contextTheme, setContextTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  // Utilizamos useEffect para guardar el tema en el localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("theme", contextTheme);
  }, [contextTheme]);
  const values = { contextTheme, setContextTheme };
  return (
    <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  return context;
};

// PropType para 'children' del componente 'AuthProvider'.
ThemeContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
