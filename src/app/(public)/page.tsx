import "./landing.css";
import LandingClient from "./landing-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "COGNARA — AI-Powered Learning Platform",
  description:
    "A sophisticated ecosystem for students, coaches, and admins. Purpose-built for high-impact educational growth with agentic AI mentorship.",
};

export default function HomePage() {
  return <LandingClient />;
}
