import mongoose, { Schema, Document } from "mongoose";

export interface IUserProfile extends Document {
  profileId: string;
  userRefId: string;

  phone?: {
    countryCode: string;
    number: string;
  };

  landline?: {
    countryCode?: string;
    number: string;
  };

  council?: string;
  profilePicture?: string;
  bio?: string;

  address?: {
    doorNo?: string;
    street?: string;
    locality?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

/* ---------- Regex Helpers ---------- */

const NAME_REGEX = /^[A-Za-z\s.'-]+$/;
const PHONE_REGEX = /^[0-9]{6,15}$/;
const COUNTRY_CODE_REGEX = /^\+[1-9]{1,4}$/;
const POSTAL_REGEX = /^[A-Za-z0-9\s\-]{3,10}$/;
const NO_HTML_REGEX = /<[^>]*>/;

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

/* ---------- User Profile Schema ---------- */

const userProfileSchema = new Schema<IUserProfile>(
  {
    profileId: {
      type: String,
      required: true,
      unique: true,
      description: "Unique identifier for the user profile"
    },

    userRefId: {
      type: String,
      required: true,
      ref: "User",
      description: "Reference to the User.userId"
    },

    /* ---------- Basic Profile Info ---------- */

    profilePicture: {
      type: String,
      description: "URL of the user's profile picture"
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      description: "Short biography or description about the user"
    },

    council: {
      type: String,
      trim: true,
      set: normalizeWhitespace,
      maxlength: [150, "Council name cannot exceed 150 characters"],
      description: "Council or local governing body associated with the user"
    },

    /* ---------- Phone Numbers ---------- */

    phone: {
      countryCode: {
        type: String,
        match: [
          COUNTRY_CODE_REGEX,
          "Country code must start with + followed by digits"
        ],
        description: "International dialing country code (e.g. +91)"
      },

      number: {
        type: String,
        match: [
          PHONE_REGEX,
          "Phone number must contain 6–15 digits"
        ],
        description: "Primary mobile phone number"
      }
    },

    landline: {
      countryCode: {
        type: String,
        match: [
          COUNTRY_CODE_REGEX,
          "Country code must start with + followed by digits"
        ],
        description: "International dialing code for landline"
      },

      number: {
        type: String,
        match: [
          PHONE_REGEX,
          "Invalid landline number"
        ],
        description: "Landline telephone number"
      }
    },

    /* ---------- Address (UK-style structured format) ---------- */

    address: {
      doorNo: {
        type: String,
        trim: true,
        maxlength: 20,
        description: "Building number or door number"
      },

      street: {
        type: String,
        trim: true,
        maxlength: 150,
        description: "Street name"
      },

      locality: {
        type: String,
        trim: true,
        maxlength: 150,
        description: "Area, district, or locality"
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
        description: "City or town"
      },

      state: {
        type: String,
        trim: true,
        maxlength: 100,
        description: "State or county"
      },

      country: {
        type: String,
        trim: true,
        default: "India",
        maxlength: 100,
        description: "Country name"
      },

      postalCode: {
        type: String,
        match: [
          POSTAL_REGEX,
          "Invalid postal code format"
        ],
        description: "Postal or ZIP code"
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ---------- Indexes ---------- */

userProfileSchema.index({ userRefId: 1 });
userProfileSchema.index({ "address.city": 1 });
userProfileSchema.index({ "address.postalCode": 1 });

export const UserProfile = mongoose.model<IUserProfile>(
  "UserProfile",
  userProfileSchema
);