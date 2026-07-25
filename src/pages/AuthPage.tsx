/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import Login from "./Login";
import { User as UserType } from "../types";

interface AuthPageProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  return <Login onLoginSuccess={onLoginSuccess} />;
}
