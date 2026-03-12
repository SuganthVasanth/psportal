import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css"; 


ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="638723048050-8205ving3kgof6vm3kpbte74jnc4f6le.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);