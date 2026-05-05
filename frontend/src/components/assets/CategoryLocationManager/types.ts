// ---------------------------------------------------------------------------
// Form data shapes for the Category and Location editors. Both editors share
// the same overall pattern (name + description + extra field) but the extra
// field differs — categories have an icon string, locations have a parentId.
// ---------------------------------------------------------------------------

export interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
}

export interface LocationFormData {
  name: string;
  description: string;
  parentId: string;
}
