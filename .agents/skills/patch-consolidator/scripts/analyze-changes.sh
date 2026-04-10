#!/bin/bash

# Analyze git changes and group by semantic operator affinity
# Usage: ./analyze-changes.sh [--detailed] [--operator CHAR]

set -e

cd "$(git rev-parse --show-toplevel)" || exit 1

DETAILED=false
FILTER_OPERATOR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --detailed) DETAILED=true; shift ;;
        --operator) FILTER_OPERATOR="$2"; shift 2 ;;
        *) shift ;;
    esac
done

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to infer operator from file path
infer_operator() {
    local file="$1"

    # Check conventions
    if [[ "$file" =~ ^\.spw/conventions ]]; then
        if [[ "$file" =~ cognitive ]]; then echo "?" ; return; fi
        if [[ "$file" =~ semantic ]]; then echo "^" ; return; fi
        if [[ "$file" =~ whimsy ]]; then echo "*" ; return; fi
        if [[ "$file" =~ asset ]]; then echo "&" ; return; fi
        if [[ "$file" =~ electromagnetic ]]; then echo "^" ; return; fi
        if [[ "$file" =~ precipitate ]]; then echo "^" ; return; fi
        echo "#" ; return
    fi

    # Check CSS
    if [[ "$file" =~ \.css$ ]]; then
        if [[ "$file" =~ cognitive ]]; then echo "?" ; return; fi
        if [[ "$file" =~ spirit ]]; then echo "~" ; return; fi
        if [[ "$file" =~ whimsy ]]; then echo "*" ; return; fi
        if [[ "$file" =~ grain|texture ]]; then echo "." ; return; fi
        if [[ "$file" =~ container ]]; then echo "^" ; return; fi
        echo "." ; return
    fi

    # Check JS
    if [[ "$file" =~ \.js$ ]]; then
        if [[ "$file" =~ cognitive ]]; then echo "?" ; return; fi
        if [[ "$file" =~ spirit ]]; then echo "~" ; return; fi
        if [[ "$file" =~ electromagnetic ]]; then echo "^" ; return; fi
        if [[ "$file" =~ settings ]]; then echo "!" ; return; fi
        echo "@" ; return
    fi

    # Check HTML
    if [[ "$file" =~ \.html$ ]]; then
        echo "#" ; return
    fi

    # Check other
    if [[ "$file" =~ manifest|pkg ]]; then echo "#" ; return; fi
    if [[ "$file" =~ README ]]; then echo "~" ; return; fi

    echo "?" # Unknown
}

# Function to categorize file type
categorize_file() {
    local file="$1"

    if [[ "$file" =~ \.css$ ]]; then echo "CSS" ; return; fi
    if [[ "$file" =~ \.js$ ]]; then echo "JS" ; return; fi
    if [[ "$file" =~ \.html$ ]]; then echo "HTML" ; return; fi
    if [[ "$file" =~ \.spw$ ]]; then echo "Spw" ; return; fi
    if [[ "$file" =~ \.png|\.jpg|\.webp ]]; then echo "Assets" ; return; fi

    echo "Other"
}

# Get all changed files
mapfile -t changed_files < <(git diff --name-only && git diff --cached --name-only && git ls-files --others --exclude-standard)
changed_files=($(printf '%s\n' "${changed_files[@]}" | sort -u))

if [[ ${#changed_files[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No changes to analyze.${NC}"
    exit 0
fi

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}CHANGE ANALYSIS${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# Group by operator
declare -A operator_files
declare -A operator_types

for file in "${changed_files[@]}"; do
    op=$(infer_operator "$file")
    operator_files["$op"]+="$file"$'\n'

    ftype=$(categorize_file "$file")
    operator_types["$op,$ftype"]=$((${operator_types["$op,$ftype"]:-0} + 1))
done

# Display by operator
for op in $(printf '%s\n' "${!operator_files[@]}" | sort); do
    if [[ -n "$FILTER_OPERATOR" && "$op" != "$FILTER_OPERATOR" ]]; then
        continue
    fi

    files="${operator_files[$op]}"
    file_array=($files)
    count=${#file_array[@]}

    echo -e "${GREEN}Operator ${BLUE}${op}${GREEN} (${count} files)${NC}"

    # Group by file type
    declare -A types_in_op
    for file in "${file_array[@]}"; do
        ftype=$(categorize_file "$file")
        types_in_op["$ftype"]+="$file"$'\n'
    done

    for ftype in "${!types_in_op[@]}" | sort; do
        ftype_files="${types_in_op[$ftype]}"
        ftype_count=$(echo "$ftype_files" | grep -c . || echo 0)
        echo -e "  ${YELLOW}${ftype}${NC} (${ftype_count})"

        if [[ "$DETAILED" == true ]]; then
            echo "$ftype_files" | grep -v '^$' | sed 's/^/    → /'
        fi
    done

    echo ""
done

echo -e "${CYAN}SUMMARY${NC}"
echo "Total changed files: ${#changed_files[@]}"
echo "Operators involved: $(printf '%s\n' "${!operator_files[@]}" | sort | tr '\n' ' ')"
echo ""

# Suggest consolidation hints
echo -e "${CYAN}CONSOLIDATION HINTS${NC}"
echo "Files touching the same operator likely form one patch."
echo "Check if CSS, JS, HTML, and Spw files all serve the same operator."
echo ""
echo "Run: /patch-consolidator suggest-clusters"
echo "to get detailed consolidation recommendations."
