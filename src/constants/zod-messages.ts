export const ZodMessages = {
  common: {
    invalidUUID: "Invalid ID format",
    invalidDate: "Invalid date format",
  },
  metricCategory: {
    invalidId: "Invalid metric category ID",
    nameRequired: "Metric category name is required",
  },
  user: {
    usernameMin: "Username must be at least 3 characters",
    emailInvalid: "Invalid email address",
    passwordMin: "Password must be at least 6 characters",
    passwordConfirmMin: "Password confirmation must be at least 6 characters",
    passwordMismatch: "Passwords do not match",
  },
  metric: {
    nameRequired: "Metric name is required",
    unitRequired: "Metric unit is required",
    invalidCategoryId: "Invalid category ID",
    invalidOriginalMetricId: "Invalid original metric ID",
  },
  metricSettings: {
    goalValuePositive: "Goal value must be a positive number",
    invalidAlertThreshold: "Alert threshold must be an integer",
    alertThresholdMin: "Alert threshold must be at least 0",
    alertThresholdMax: "Alert threshold must be at most 100",
  },
  metricLog: {
    logValueRequired: "Log value is required",
    logValueNonNegative: "Log value must be a positive number",
    logTypeInvalid: "Invalid log type",
  },
};
