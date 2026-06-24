#!/bin/bash
set -e

# Machine-readable harness anchor: Next steps

echo "=== 智能体协作基线校验 ==="

echo "=== 执行 npm test ==="
npm test

echo "=== 执行 npm run build ==="
npm run build

echo "=== 校验完成 ==="
echo ""
echo "下一步："
echo "1. 阅读 feature_list.json，确认当前功能状态"
echo "2. 仅选择一项未完成事项进行处理"
echo "3. 只实现该事项范围内的变更"
echo "4. 声称完成前重新运行本校验脚本"
