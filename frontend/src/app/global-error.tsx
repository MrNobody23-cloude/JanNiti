"use client";

// export default function GlobalError({
//   error,
//   reset,
// }: {
//   error: Error & { digest?: string };
//   reset: () => void;
// }) {
//   // Log on the client only – no useEffect needed since global-error
//   // is rendered only when an unhandled error occurs at runtime.
//   if (typeof window !== "undefined") {
//     console.error(error);
//   }

//   return (
//     <html lang="en">
//       <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#f9fafb", color: "#111827" }}>
//         <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
//           <div style={{ maxWidth: "28rem", borderRadius: "1rem", border: "1px solid #e5e7eb", backgroundColor: "#fff", padding: "2rem", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
//             <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5" }}>
//               Application Error
//             </p>
//             <h1 style={{ marginTop: "0.75rem", fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
//             <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
//               The app hit a rendering error while building this page.
//             </p>
//             <button
//               type="button"
//               onClick={() => reset()}
//               style={{ marginTop: "1.5rem", borderRadius: "0.5rem", backgroundColor: "#4f46e5", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#fff", border: "none", cursor: "pointer" }}
//             >
//               Try again
//             </button>
//           </div>
//         </div>
//       </body>
//     </html>
//   );
// }