#!/usr/bin/env node

/**
 * Debug script to find localStorage usage in the codebase
 * This will help identify where the SecurityError is coming from
 */

const fs = require('fs');
const path = require('path');

const searchDir = path.join(__dirname, '../src');
const results = [];

function searchFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules') {
                searchFiles(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                // Check for localStorage access without proper guards
                if (line.includes('localStorage') || line.includes('sessionStorage')) {
                    const lineNum = index + 1;
                    const hasWindowCheck = content.includes('typeof window') || content.includes('window === undefined');
                    const hasTryCatch = content.includes('try {') && content.includes('catch');
                    const hasUseEffect = content.includes('useEffect');
                    const isClientComponent = content.includes("'use client'") || content.includes('"use client"');

                    results.push({
                        file: fullPath.replace(searchDir, ''),
                        line: lineNum,
                        content: line.trim(),
                        hasWindowCheck,
                        hasTryCatch,
                        hasUseEffect,
                        isClientComponent,
                        severity: (!hasWindowCheck || !isClientComponent) ? 'HIGH' : 'LOW'
                    });
                }
            });
        }
    }
}

console.log('🔍 Searching for localStorage/sessionStorage usage...\n');
searchFiles(searchDir);

if (results.length === 0) {
    console.log('✅ No localStorage/sessionStorage usage found!');
} else {
    console.log(`Found ${results.length} instances:\n`);

    // Group by severity
    const high = results.filter(r => r.severity === 'HIGH');
    const low = results.filter(r => r.severity === 'LOW');

    if (high.length > 0) {
        console.log('🚨 HIGH PRIORITY (likely causing the error):\n');
        high.forEach(r => {
            console.log(`📄 File: src${r.file}`);
            console.log(`📍 Line ${r.line}: ${r.content}`);
            console.log(`   Client Component: ${r.isClientComponent ? '✅' : '❌'}`);
            console.log(`   Window Check: ${r.hasWindowCheck ? '✅' : '❌'}`);
            console.log(`   Try-Catch: ${r.hasTryCatch ? '✅' : '❌'}`);
            console.log('');
        });
    }

    if (low.length > 0) {
        console.log('\n✅ LOW PRIORITY (properly guarded):\n');
        low.forEach(r => {
            console.log(`📄 File: src${r.file} (Line ${r.line})`);
        });
    }
}
