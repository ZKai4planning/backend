import swaggerAutogen from "swagger-autogen";
import fs from "fs";
import path from "path";

type RouteConfig = {
  file: string;
  prefix: string;
  tag: string;
};

const doc = {
  swagger: "2.0",
  info: {
    title: "AI4Planning Service Platform API",
    description:
      "## 🤖 AI4Planning API Documentation\n\n" +
      "This API provides endpoints for managing the **AI4Planning Service Platform**.\n\n" +

      "### 🧩 Core Modules\n" +
      "- 🔐 Client Authentication\n" +
      "- 🛠️ Admin Management\n" +
      "- 📦 Services & SubServices\n" +
      "- 👥 Role Management\n" +
      "- 📍 Address Lookup\n\n" +

      "### 🚀 Project Stages\n" +
      "- 📝 Planning & Requirement Analysis\n" +
      "- 🏗️ Architecture & System Design\n" +
      "- ⚙️ Backend API Development\n" +
      "- 🔑 Authentication & Security Implementation\n" +
      "- 🧪 Testing & Validation\n" +
      "- 🚀 Deployment & Monitoring\n\n" +

      "### 🌐 Base URL\n" +
      "`http://localhost:5000/api/v1`\n\n" +

      "### 🔐 Authentication\n" +
      "Most endpoints require **JWT Bearer Token**.\n\n" +

      "### 🛡️ Security Implementation\n" +
      "- 🔑 **JWT RS256 Authentication**\n" +
      "- 🆔 Token verification using **kid (Key ID)**\n" +
      "- 🌍 **JWKS (JSON Web Key Set)** endpoint support\n" +
      "- 🔄 **Automatic Key Generation & Rotation** for enhanced security\n\n" +

      "### 📡 API Standards\n" +
      "- 📦 RESTful API Design\n" +
      "- 🧾 JSON Request/Response Format\n" +
      "- ⚠️ Standardized Error Handling\n" +
      "- 📚 Swagger/OpenAPI Documentation\n\n" +

      "### 🛠️ Development Stack\n" +
      "- 🟢 Node.js + Express\n" +
      "- 🔷 TypeScript\n" +
      "- 🍃 MongoDB + Mongoose\n" +
      "- 📘 Swagger (OpenAPI 3)\n",
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "support@ai4planning.com",
    },
  },
  host: "localhost:5000",
  basePath: "/api/v1",
  schemes: ["http"],
  tags: [
    {
      name: "Admin Configuration",
      description:
        "Endpoints for managing system-level configuration and application settings.",
    },
    {
      name: "Roles",
      description:
        "APIs for creating, updating, and managing user roles and permissions within the system.",
    },
    {
      name: "Client Auth",
      description:
        "Authentication endpoints for clients including login, registration, token management, and password operations.",
    },
    {
      name: "Client Users",
      description:
        "APIs to manage client user accounts including creation, updates, listing, and deletion.",
    },
    {
      name: "Client Profile",
      description:
        "Endpoints for retrieving and updating client profile information.",
    },
    {
      name: "Admin Auth",
      description:
        "Authentication APIs for administrators including login, token refresh, and password management.",
    },
    {
      name: "Admin Users",
      description:
        "Endpoints for managing administrator accounts including creation, updates, role assignments, and removal.",
    },
    {
      name: "Admin Profile",
      description: "APIs to retrieve and update administrator profile details.",
    },
    {
      name: "Employee Auth",
      description:
        "Authentication endpoints for employees including login, token handling, and password management.",
    },
    {
      name: "Employee Users",
      description:
        "APIs for managing employee accounts including onboarding, updates, listing, and deletion.",
    },
    {
      name: "Employee Profile",
      description: "Endpoints for accessing and updating employee profile information.",
    },
    {
      name: "Address Lookup",
      description:
        "APIs for retrieving location and address-related data such as states, cities, or postal codes.",
    },
    {
      name: "Services",
      description:
        "Endpoints for managing available services including creation, updates, listing, and deletion.",
    },
    {
      name: "SubServices",
      description:
        "APIs for managing sub-services associated with primary services.",
    },
    {
      name: "Service Analytics",
      description:
        "Endpoints for retrieving analytics, metrics, and reports related to services usage and performance.",
    },
    {
      name: "Project Stages",
      description:
        "APIs for managing workflow stages and the initial stage in the project lifecycle.",
    },
    {
      name: "JWKS",
      description:
        "Public JWKS endpoint used for JWT verification by external services.",
    },
  ],
};

const outputFile = "./src/swagger.json";

const routeConfigs: RouteConfig[] = [
  { file: "./src/routes/v1/config.routes.ts", prefix: "/configuration", tag: "Admin Configuration" },
  { file: "./src/routes/v1/role.routes.ts", prefix: "/roles", tag: "Roles" },
  { file: "./src/routes/v1/auth.routes.ts", prefix: "/auth", tag: "Client Auth" },
  { file: "./src/routes/v1/user.routes.ts", prefix: "/users", tag: "Client Users" },
  { file: "./src/routes/v1/userprofile.routes.ts", prefix: "/profile", tag: "Client Profile" },
  { file: "./src/routes/v1/adminauth.routes.ts", prefix: "/admin/auth", tag: "Admin Auth" },
  { file: "./src/routes/v1/adminuser.routes.ts", prefix: "/admin/users", tag: "Admin Users" },
  { file: "./src/routes/v1/adminprofile.routes.ts", prefix: "/admin/profile", tag: "Admin Profile" },
  { file: "./src/routes/v1/employeeauth.routes.ts", prefix: "/employee/auth", tag: "Employee Auth" },
  { file: "./src/routes/v1/employeeuser.routes.ts", prefix: "/employee/users", tag: "Employee Users" },
  { file: "./src/routes/v1/employeeprofile.routes.ts", prefix: "/employee/profile", tag: "Employee Profile" },
  { file: "./src/routes/v1/address-lookup.routes.ts", prefix: "/address-lookup", tag: "Address Lookup" },
  { file: "./src/routes/v1/service.routes.ts", prefix: "/services", tag: "Services" },
  { file: "./src/routes/v1/subservices.routes.ts", prefix: "/subservices", tag: "SubServices" },
  { file: "./src/routes/v1/service.analytics.routes.ts", prefix: "/service-analytics", tag: "Service Analytics" },
  { file: "./src/routes/v1/projectStage.route.ts", prefix: "/project-stage", tag: "Project Stages" },
  { file: "./src/routes/v1/jwks.route.ts", prefix: "/", tag: "JWKS" },
];

const joinPath = (prefix: string, routePath: string) => {
  const cleanPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  if (routePath === "/" || routePath === "") return cleanPrefix;
  const cleanRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${cleanPrefix}${cleanRoute}`;
};

const generate = async () => {
  const autogen = swaggerAutogen();
  const tmpDir = path.join(process.cwd(), ".swagger-tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const merged: any = {
    ...doc,
    paths: {},
    tags: Array.isArray(doc.tags) ? [...doc.tags] : [],
  };

  for (let i = 0; i < routeConfigs.length; i += 1) {
    const cfg = routeConfigs[i];
    const tmpFile = path.join(tmpDir, `swagger-${i}.json`);

    await autogen(tmpFile, [cfg.file], doc);

    const part = JSON.parse(fs.readFileSync(tmpFile, "utf8"));
    const paths = part.paths || {};

    Object.entries(paths).forEach(([routePath, ops]) => {
      const fullPath = joinPath(cfg.prefix, routePath);
      if (!merged.paths[fullPath]) merged.paths[fullPath] = {};

      Object.entries(ops as Record<string, any>).forEach(([method, spec]) => {
        if (spec && typeof spec === "object") {
          const consumes = Array.isArray(spec.consumes) ? spec.consumes : [];
          if (consumes.includes("multipart/form-data") && Array.isArray(spec.parameters)) {
            spec.parameters = spec.parameters.filter(
              (p: { in?: string }) => p && p.in !== "body"
            );
          }
          spec.tags = [cfg.tag];
        }
        merged.paths[fullPath][method] = spec;
      });
    });

    if (!merged.tags.find((t: { name: string }) => t.name === cfg.tag)) {
      merged.tags.push({ name: cfg.tag });
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));
  fs.rmSync(tmpDir, { recursive: true, force: true });
};

generate();
