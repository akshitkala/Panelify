**PANELIFY**

_lib/refactor.ts — Specification Document_

Version 1.0 — Before/After Examples + Safety Rules

Deadline: March 10, 2026

# **1\. Purpose**

lib/refactor.ts is the module that rewrites a user's JSX components to import their content from content.json rather than having it hardcoded in the file. This is the most critical transformation in Panelify — if it breaks, the user's site breaks. This document provides before/after examples, transformation rules, and safety guarantees so the module can be built and tested with full confidence.

# **2\. Core Principle**

The refactor must do one thing and do it safely: replace hardcoded string literals and image paths in JSX with reads from a content object imported from content.json. The component's structure, logic, className, event handlers, and non-editable strings must never change. Only the specific values that the AI scanner identified as editable fields are touched.

The module uses Babel parser + traverse — not regex. This is non-negotiable. Regex cannot handle JSX safely because it cannot distinguish string literals in attributes from strings in event handlers, template literals, or comment nodes. Babel gives a typed AST where every node is identified by kind.

# **3\. Input / Output Contract**

| **Parameter** | **Description** |
| --- | --- |
| files | Array of { path: string, content: string } — the raw JSX/TSX files fetched from GitHub |
| schema | The ContentSchema object produced by /api/scan/prepare — maps section → field_id → current_value |

| **Return value field** | **Description** |
| --- | --- |
| path | Same path as input — unchanged |
| new_content | The refactored JSX as a string. Must be valid JSX parseable by Babel with zero errors. |

# **4\. Before / After Examples**

These are the canonical examples. Every pattern the refactor module must handle is shown here. Build against these, and test against these.

## **4.1 Text String in JSX Element**

The most common pattern. A string literal is the direct child of a JSX element.

### **BEFORE — hardcoded**

// Hero.jsx

import React from 'react';

export default function Hero() {

return (

&lt;section className="hero"&gt;

&lt;h1&gt;We Build Amazing Products&lt;/h1&gt;

&lt;p&gt;A passionate team of developers&lt;/p&gt;

&lt;button&gt;Get Started&lt;/button&gt;

&lt;/section&gt;

);

}

### **AFTER — refactored**

// Hero.jsx — after refactor

import React from 'react';

import content from '../content.json';

export default function Hero() {

const { hero } = content;

return (

&lt;section className="hero"&gt;

&lt;h1&gt;{hero.title}&lt;/h1&gt;

&lt;p&gt;{hero.subtitle}&lt;/p&gt;

&lt;button&gt;{hero.cta}&lt;/button&gt;

&lt;/section&gt;

);

}

## **4.2 String in JSX Attribute (src / alt / href)**

Image src and alt attributes are common editable fields. They appear as JSX attributes, not element children.

### **BEFORE**

&lt;img src="/images/hero.jpg" alt="Hero image" /&gt;

### **AFTER**

&lt;img src={hero.image} alt="Hero image" /&gt;

// Note: alt text is NOT replaced unless it was flagged as an editable field.

// Only fields that appear in the ContentSchema are touched.

## **4.3 String in JSX Template Literal**

Some attributes use template literals. The refactor replaces only the string value inside.

### **BEFORE**

&lt;section style={{ backgroundImage: \`url('/images/hero.jpg')\` }}&gt;

### **AFTER**

&lt;section style={{ backgroundImage: \`url('${hero.image}')\` }}&gt;

## **4.4 Relative Import Path Calculation**

The import path to content.json is calculated relative to the component's file path. The module must compute this correctly for components in subdirectories.

// Component at: components/Hero.jsx

import content from '../content.json'; // ✓ correct

// Component at: components/sections/About.jsx

import content from '../../content.json'; // ✓ correct

// Component at: Hero.jsx (repo root)

import content from './content.json'; // ✓ correct

## **4.5 One Import Per Component — Multi-Section Destructuring**

Each component gets exactly one import statement and one destructure line. If a component has fields from multiple sections, all are destructured together.

// If a component has fields from multiple sections:

import content from '../content.json';

const { hero, stats } = content; // destructure all needed sections

# **5\. What Must NOT Be Changed**

This is the safety boundary. The refactor module must leave all of the following completely untouched.

| **Must NOT touch** | **Reason** |
| --- | --- |
| className attributes | Styling — never editable content |
| Event handlers (onClick, onChange, etc.) | Logic — never editable content |
| Non-editable strings not in ContentSchema | Only schema fields are replaced — nothing else |
| Existing import statements | Only add the content.json import — never remove or change existing imports |
| Component function signature | Props, name, export — unchanged |
| JSX structure and nesting | No elements added, moved, or removed |
| TypeScript types and interfaces | Type annotations are never touched |
| Comments | Preserve all existing comments |
| Strings containing only whitespace | Skip — not content |
| Strings shorter than 2 characters | Skip — likely not content (e.g. '/' or '-') |

# **6\. Safety Rules**

These rules are non-negotiable. Each one prevents a class of site-breaking bugs.

## **Rule 1 — Validate Output with Babel Before Returning**

After generating new_content, run Babel parser on it. If parsing throws, the refactor failed. Return a REFACTOR_ERROR for that file — do not return broken JSX.

import \* as parser from '@babel/parser';

function validateJSX(code: string, path: string): void {

try {

parser.parse(code, { sourceType: 'module', plugins: \['jsx', 'typescript'\] });

} catch (err) {

throw new Error(\`REFACTOR_ERROR: ${path} produced invalid JSX\`);

}

}

## **Rule 2 — Never Add the Import Twice**

Before inserting the content.json import, check if the file already contains it. If it does, skip the import insertion step.

const alreadyImported = code.includes("from '../content.json'");

if (!alreadyImported) {

// prepend import statement

}

## **Rule 3 — Only Replace Fields That Exist in the Schema**

The schema is the source of truth. If a string in the JSX looks like content but is not in the ContentSchema, leave it alone. Do not attempt heuristic replacement.

## **Rule 4 — Preserve Original File if Zero Fields Match**

If a component file has no fields in the schema, return the original content unchanged. Do not add an import. Do not add a destructure.

## **Rule 5 — Backup Branch Assumed Present**

lib/refactor.ts does not create a backup branch. The API flow ensures /api/setup/backup runs before /api/setup/refactor. The refactor module can assume a backup already exists.

# **7\. Function Signature**

// lib/refactor.ts

import { ContentSchema } from '../types/content';

export interface RefactorInput {

path: string;

content: string;

}

export interface RefactorOutput {

path: string;

new_content: string;

}

export async function refactorFiles(

files: RefactorInput\[\],

schema: ContentSchema

): Promise&lt;RefactorOutput\[\]&gt;

// Throws REFACTOR_ERROR if Babel validation fails on any file.

// Returns original content unchanged for files with zero schema matches.

# **8\. Deploy Status Polling — lib/deploy-poll.ts**

The TRD (FR-P-07) requires deploy status polling for both Vercel and Netlify after publish. This section documents the chosen implementation approach.

## **Approach: URL Polling**

Rather than integrating Vercel or Netlify deploy APIs (which would require additional OAuth scopes), Panelify polls the live site URL directly. This approach requires zero additional tokens and works identically for both platforms.

// lib/deploy-poll.ts

export async function pollForDeploy(

siteUrl: string, // e.g. https://my-agency-site.vercel.app

expectedValue: string, // a unique value from the just-committed content.json

maxAttempts = 20, // 20 × 3s = 60 second max wait

intervalMs = 3000

): Promise&lt;'live' | 'timeout'&gt;

// Strategy:

// 1. Fetch siteUrl every 3 seconds

// 2. Check if response body contains expectedValue

// 3. If yes → return 'live'

// 4. If 20 attempts pass without match → return 'timeout'

// 5. Screen 9 shows 'Deployed!' on 'live', 'Taking longer than usual...' on 'timeout'

The expectedValue should be a unique string from the just-published content — for example the new hero title. Choose a value unlikely to appear in the site's existing HTML. Avoid generic words like "About" or "Home".

# **9\. Acceptance Tests**

Run these manually before marking lib/refactor.ts complete. All must pass.

| **#** | **Test** | **Expected Result** |
| --- | --- | --- |
| 1   | Run refactor on Hero.jsx with hero section in schema | Output contains import from content.json and {hero.title} etc. Babel parse passes. |
| 2   | Run refactor on Hero.jsx with NO matching fields in schema | Output is identical to input. No import added. |
| 3   | Run refactor on component that already has content.json import | Import not duplicated. Fields still replaced correctly. |
| 4   | Run refactor on component at components/sections/About.jsx | Import path is ../../content.json — correct depth |
| 5   | className='hero-section' present in output | className is unchanged — not replaced with content reference |
| 6   | Force a syntax error in output (inject bad JSX via mock) | Function throws REFACTOR_ERROR. Does not return broken JSX. |
| 7   | Run refactor on the full demo repo (all components) | Site loads correctly after commit. No visual differences. No console errors. |

**PANELIFY V1 — lib/refactor.ts SPECIFICATION COMPLETE**

_Next: Start building — Day 7_