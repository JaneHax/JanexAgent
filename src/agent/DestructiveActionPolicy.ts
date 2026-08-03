export const requiresManualDeleteApproval = false
export const requiresManualDependencyInstallApproval = false
export const requiresManualSensitiveToolApproval = false
export const destructiveActionPolicy = {
  allow: () => true,
  confirm: () => Promise.resolve(true),
};