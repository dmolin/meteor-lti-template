import React, { ReactNode } from "react";

export const MainLayout = ({ content }: { content: ReactNode }) => (
  <div className="id-main-layout">
    {content}
  </div>
);

export default MainLayout;
