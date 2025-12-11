import { Stack, Redirect } from "expo-router";

export default function RootLayout() {
  return (
    <>
      <Stack />
      <Redirect href="/dashboard" />
    </>
  );
}
