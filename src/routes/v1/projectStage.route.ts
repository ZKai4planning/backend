import { Router } from "express";
import { createProjectStage, updateProjectStage, getProjectStageList, getInitialProjectStages, getProjectStageDetails, softDeleteProjectStage, restoreProjectStage, permanentlyDeleteProjectStage } from "../../modules/project-stages/projectStage.controller";


const router = Router();

router.post("/", createProjectStage);

router.put("/:stageId", updateProjectStage);

router.get("/",
    /*

    #swagger.parameters['includeDeleted'] = {
      in: 'query',
      required: false,
      type: 'boolean'
    }
  */
    getProjectStageList);

router.get("/initial", getInitialProjectStages);

router.get("/:stageId", getProjectStageDetails);

router.delete("/:stageId", softDeleteProjectStage);

router.patch("/restore/:stageId", restoreProjectStage);

router.delete("/permanent/:stageId", permanentlyDeleteProjectStage);

export default router;
