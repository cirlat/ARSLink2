import React from "react";
import { RouteObject } from "react-router-dom";

// This file is used by Tempo to add routes for storyboards
// It will be imported in App.tsx

const routes: RouteObject[] = [
  {
    path: "/tempobook/*",
    element: <div>Tempo Storyboard Route</div>,
  },
];

export default routes;
