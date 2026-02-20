import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation - PuraToDo",
  description: "PuraToDo REST API Documentation",
};

export default function ApiDocsPage() {
  return (
    <div style={{ height: "100vh" }}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
        />
      </head>
      <div id="swagger-ui" />
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              SwaggerUIBundle({
                url: "/api/openapi",
                dom_id: '#swagger-ui',
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                deepLinking: true,
                displayOperationId: false,
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
              });
            }
          `,
        }}
      />
    </div>
  );
}
