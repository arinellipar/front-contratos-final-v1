"use client";

import { use, useState } from "react";

interface TestResults {
  envVars: {
    NEXT_PUBLIC_API_URL: string;
    NODE_ENV: string;
    NEXTAUTH_URL: string;
  };
  apiConnectivity: {
    status: number;
    statusText: string;
    success: boolean;
    url: string;
  };
  apiResponse: any;
  cors: {
    status: number;
    statusText: string;
    success: boolean;
  };
  deleteTest?: {
    status: number;
    statusText: string;
    success: boolean;
    url: string;
  };
  browser?: {
    userAgent: string;
    origin: string;
    href: string;
  };
  error: {
    message: string;
    name: string;
  } | null;
}

export default function ConnectionTest() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    let results: TestResults = {
      envVars: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "NOT SET",
        NODE_ENV: "production",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
      },
      apiConnectivity: { status: 0, statusText: "", success: false, url: "" },
      apiResponse: null,
      cors: { status: 0, statusText: "", success: false },
      error: null,
    };

    try {
      // Test basic connectivity
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://fradema-backend-api.azurewebsites.net/api/v1"}/health`
      );
      results.apiConnectivity = {
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        url: response.url,
      };

      if (response.ok) {
        try {
          results.apiResponse = await response.json();
        } catch (e) {
          results.apiResponse = { error: "Failed to parse JSON response" };
        }
      }

      // Test CORS
      try {
        const corsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://fradema-backend-api.azurewebsites.net/api/v1"}/health`,
          {
            method: "OPTIONS",
            headers: {
              Origin: window.location.origin,
              "Access-Control-Request-Method": "GET",
            },
          }
        );
        results.cors = {
          status: corsResponse.status,
          statusText: corsResponse.statusText,
          success: corsResponse.ok,
        };
      } catch (e) {
        results.cors = {
          status: 0,
          statusText: "CORS test failed",
          success: false,
        };
      }

      // Test DELETE endpoint specifically
      try {
        const deleteResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://fradema-backend-api.azurewebsites.net/api/v1"}/contracts/999`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        results.deleteTest = {
          status: deleteResponse.status,
          statusText: deleteResponse.statusText,
          success: deleteResponse.ok,
          url: deleteResponse.url,
        };
      } catch (e) {
        results.deleteTest = {
          status: 0,
          statusText: "DELETE test failed",
          success: false,
          url: "",
        };
      }

      // Browser Information
      results.browser = {
        userAgent: navigator.userAgent,
        origin: window.location.origin,
        href: window.location.href,
      };

    } catch (error: any) {
      results.error = {
        message: error.message,
        name: error.name,
      };
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        Frontend-Backend Connection Test
      </h1>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? "Running Tests..." : "Run Connection Tests"}
        </button>
      </div>

      {testResults && (
        <div className="space-y-6">
          {/* Environment Variables */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">
              Environment Variables
            </h2>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(testResults.envVars, null, 2)}
            </pre>
          </div>

          {/* API Connectivity */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">API Connectivity</h2>
            <div
              className={`p-3 rounded ${testResults.apiConnectivity?.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              Status:{" "}
              {testResults.apiConnectivity?.success
                ? "✅ Connected"
                : "❌ Failed"}
            </div>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto mt-2">
              {JSON.stringify(testResults.apiConnectivity, null, 2)}
            </pre>
            {testResults.apiResponse && (
              <>
                <h3 className="font-semibold mt-3 mb-1">API Response:</h3>
                <pre className="bg-gray-800 text-blue-400 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(testResults.apiResponse, null, 2)}
                </pre>
              </>
            )}
          </div>

          {/* CORS Test */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">CORS Test</h2>
            <div
              className={`p-3 rounded ${testResults.cors?.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              CORS: {testResults.cors?.success ? "✅ Allowed" : "❌ Blocked"}
            </div>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto mt-2">
              {JSON.stringify(testResults.cors, null, 2)}
            </pre>
          </div>

          {/* DELETE Test */}
          {testResults.deleteTest && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">DELETE Test</h2>
              <div
                className={`p-3 rounded ${testResults.deleteTest?.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                DELETE: {testResults.deleteTest?.success ? "✅ Success" : "❌ Failed"}
              </div>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto mt-2">
                {JSON.stringify(testResults.deleteTest, null, 2)}
              </pre>
            </div>
          )}

          {/* Browser Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Browser Information</h2>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(testResults.browser, null, 2)}
            </pre>
          </div>

          {/* Quick Fixes */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Quick Fixes</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                If API connectivity fails: Check if backend is running at
                https://fradema-backend-api.azurewebsites.net
              </li>
              <li>
                If CORS is blocked: Add your Vercel domain to backend CORS
                configuration
              </li>
              <li>
                If environment variables are missing: Add them in Vercel
                dashboard
              </li>
              <li>
                If all tests pass but app still fails: Check authentication and
                specific API endpoints
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
