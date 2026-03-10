import mongoose, { Schema, Document } from "mongoose";
import { TITLE_REGEX, REPEATED_CHAR_REGEX, NO_HTML_REGEX, normalizeWhitespace } from "../../utils/regex.utils";

/* =====================================================
   Interfaces
===================================================== */

export interface INextCard {
    eyebrow?: string;
    title: string;
    description: string;
    highlights?: string[];
    ctaLabel?: string;
    ctaPath?: string;
    ctaStage?: string;
}

export interface IProjectStage extends Document {
    stageId: string;
    label: string;
    route: string;
    legacyRoutes?: string[];
    icon?: string;
    priority: number;
    initialStage: boolean;
    nextCard?: INextCard;
    status: boolean;
}



/* =====================================================
   Next Card Schema
   (UI metadata shown on dashboard)
===================================================== */

const nextCardSchema = new Schema<INextCard>(
    {
        eyebrow: {
            type: String,
            trim: true,
            set: normalizeWhitespace,
            maxlength: [100, "Eyebrow cannot exceed 100 characters"],
            description: "Small helper text shown above the card title",
        },

        title: {
            type: String,
            required: [true, "Next card title is required"],
            trim: true,
            set: normalizeWhitespace,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [150, "Title cannot exceed 150 characters"],
            match: [TITLE_REGEX, "Invalid characters in title"],
            validate: [
                {
                    validator: (value: string) => !NO_HTML_REGEX.test(value),
                    message: "HTML tags are not allowed in title",
                },
                {
                    validator: (value: string) => !REPEATED_CHAR_REGEX.test(value),
                    message: "Title contains too many repeated characters",
                },
            ],
            description: "Main title displayed in the next action card",
        },

        description: {
            type: String,
            required: [true, "Next card description is required"],
            trim: true,
            set: normalizeWhitespace,
            minlength: [5, "Description must be at least 5 characters"],
            maxlength: [1000, "Description cannot exceed 1000 characters"],
            description: "Detailed description shown in dashboard card",
        },

        highlights: {
            type: [String],
            default: [],
            validate: {
                validator: (arr: string[]) => arr.length <= 10,
                message: "Highlights cannot exceed 10 items",
            },
            description: "Optional bullet highlights shown in UI",
        },

        ctaLabel: {
            type: String,
            trim: true,
            set: normalizeWhitespace,
            maxlength: [100, "CTA label cannot exceed 100 characters"],
            description: "Call-to-action button text",
        },

        ctaPath: {
            type: String,
            trim: true,
            maxlength: [300, "CTA path cannot exceed 300 characters"],
            description: "Frontend route path triggered by CTA",
        },

        ctaStage: {
            type: String,
            trim: true,
            maxlength: [100, "CTA stage reference cannot exceed 100 characters"],
            description: "Optional next stage reference triggered by CTA",
        },
    },
    { _id: false }
);

/* =====================================================
   Project Stage Schema
===================================================== */

const projectStageSchema = new Schema<IProjectStage>(
    {
        stageId: {
            type: String,
            required: [true, "Stage ID is required"],
            unique: true,
            index: true,
            trim: true,
            set: normalizeWhitespace,
            minlength: [2, "Stage ID must be at least 2 characters"],
            maxlength: [100, "Stage ID cannot exceed 100 characters"],
            description:
                "Unique internal identifier for the workflow stage (e.g., service-payment)",
        },

        label: {
            type: String,
            required: [true, "Stage label is required"],
            trim: true,
            set: normalizeWhitespace,
            minlength: [2, "Label must be at least 2 characters"],
            maxlength: [120, "Label cannot exceed 120 characters"],
            match: [TITLE_REGEX, "Invalid characters in label"],
            validate: {
                validator: (value: string) => !NO_HTML_REGEX.test(value),
                message: "HTML tags are not allowed in label",
            },
            description: "Human-readable label displayed in UI",
        },

        route: {
            type: String,
            required: [true, "Route is required"],
            trim: true,
            unique: true,
            maxlength: [150, "Route cannot exceed 150 characters"],
            description: "Frontend route used to navigate to this stage",
        },

        legacyRoutes: {
            type: [String],
            default: [],
            description:
                "Older frontend routes that still map to this stage (backwards compatibility)",
        },

        icon: {
            type: String,
            trim: true,
            maxlength: [100, "Icon name cannot exceed 100 characters"],
            description:
                "Frontend icon identifier (lucide-react / heroicons / etc)",
        },

        priority: {
            type: Number,
            required: [true, "Priority is required"],
            min: [1, "Priority must be greater than 0"],
            unique: true,
            index: true,
            description:
                "Determines the order of stages in the workflow (lower number = earlier stage)",
        },

        initialStage: {
            type: Boolean,
            default: false,
            index: true,
            description:
                "Marks the first stage in the workflow when a new project is created",
        },

        nextCard: {
            type: nextCardSchema,
            default: null,
            description:
                "UI card configuration displayed for guiding the user to the next step",
        },

        status: {
            type: Boolean,
            default: true,
            index: true,
            description:
                "Determines whether the stage is active or disabled in the workflow",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

/* =====================================================
   Ensure only ONE initial stage exists
===================================================== */

projectStageSchema.pre<IProjectStage>("save", async function () {
    if (this.initialStage) {
        await mongoose.model<IProjectStage>("ProjectStage").updateMany(
            { _id: { $ne: this._id } },
            { $set: { initialStage: false } }
        );
    }
});

/* =====================================================
   Model
===================================================== */

export const ProjectStage = mongoose.model<IProjectStage>(
    "ProjectStage",
    projectStageSchema
);
