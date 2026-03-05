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
    title: "My API",
    description: "API documentation",
    version: "1.0.0",
  },
  host: "localhost:5000",
  basePath: "/api/v1",
  schemes: ["http"],
};

const outputFile = "./src/swagger.json";

const routeConfigs: RouteConfig[] = [
  { file: "./src/routes/v1/auth.routes.ts", prefix: "/auth", tag: "Client Auth" },
  { file: "./src/routes/v1/user.routes.ts", prefix: "/users", tag: "Client Users" },
  { file: "./src/routes/v1/adminauth.routes.ts", prefix: "/admin/auth", tag: "Admin Auth" },
  { file: "./src/routes/v1/adminuser.routes.ts", prefix: "/admin/users", tag: "Admin Users" },
  { file: "./src/routes/v1/service.routes.ts", prefix: "/services", tag: "Services" },
  { file: "./src/routes/v1/new.services.routes.ts", prefix: "/new-services", tag: "New Services" },
  { file: "./src/routes/v1/subservices.routes.ts", prefix: "/subservices", tag: "Subservices" },
  { file: "./src/routes/v1/service.analytics.routes.ts", prefix: "/service-analytics", tag: "Service Analytics" },
  { file: "./src/routes/v1/role.routes.ts", prefix: "/roles", tag: "Roles" },
  { file: "./src/routes/v1/address-lookup.routes.ts", prefix: "/address-lookup", tag: "Address Lookup" },
  { file: "./src/routes/v1/config.routes.ts", prefix: "/configuration", tag: "Configuration" },
  { file: "./src/routes/v1/userprofile.routes.ts", prefix: "/profile", tag: "Profile" },
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
    tags: [],
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
