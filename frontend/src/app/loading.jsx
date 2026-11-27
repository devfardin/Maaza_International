// Route-level loading state. The InitialLoader already covers the screen while the app boots,
// so this renders nothing and the user never sees two loaders stacked.
export default function Loading() {
  return null;
}
