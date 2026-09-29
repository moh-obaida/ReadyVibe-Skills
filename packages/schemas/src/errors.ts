export type ArtifactErrorCode =
  | "ARTIFACT_INVALID"
  | "ARTIFACT_MAJOR_UNSUPPORTED"
  | "ARTIFACT_NEWER_MINOR"
  | "ARTIFACT_HASH_MISMATCH"
  | "ARTIFACT_STATUS_AUTHORITY"
  | "ARTIFACT_CONTAINS_SECRET"
  | "ARTIFACT_PATH_ESCAPE";

export class ArtifactError extends Error {
  readonly code: ArtifactErrorCode;
  readonly pointer?: string;
  readonly warnings: string[];

  constructor(code: ArtifactErrorCode, message: string, pointer?: string, warnings: string[] = []) {
    super(message);
    this.name = "ArtifactError";
    this.code = code;
    this.pointer = pointer;
    this.warnings = warnings;
  }
}
