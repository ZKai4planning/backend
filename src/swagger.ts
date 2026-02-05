import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "My API",
    description: "API documentation",
    version: "1.0.0",
  },
  host: "localhost:3000",
  basePath: "/api/v1",
  schemes: ["http"],
};

const outputFile = "./swagger.json";

const routes = [
 "./src/routes/v1/address-lookup.routes.ts",
  "./src/routes/v1/adminauth.routes.ts",
  "./src/routes/v1/adminuser.routes.ts",
  "./src/routes/v1/auth.routes.ts",
  "./src/routes/v1/config.routes.ts",
  "./src/routes/v1/role.routes.ts",
  "./src/routes/v1/service.routes.ts",
  "./src/routes/v1/user.routes.ts",
  "./src/routes/v1/userprofile.routes.ts",

];  

swaggerAutogen()(outputFile, routes, doc);
