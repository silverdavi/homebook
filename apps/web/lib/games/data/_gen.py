#!/usr/bin/env python3
import sys, os
lines = []
def e(y,ev,c,d): return f"  {{ year: {y}, event: "{ev}", category: "{c}", difficulty: "{d}" }},"
def sec(t): lines.extend([f"  // {chr(61)*60}",f"  // {t}",f"  // {chr(61)*60}"])
