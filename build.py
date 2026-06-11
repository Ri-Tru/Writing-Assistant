"""
该脚本用于自动将README,CHANGELOG,CONFIG,EXAMPLES等文件移动到指定位置,
生成符合VSCode扩展规范的目录结构并打包，
打包后会自动删除临时复制的文档文件。
需要Python环境与Node.js环境安装并添加至环境变量。
"""
import os
import shutil
import subprocess
import sys

# 定义路径（基于脚本所在目录为项目根目录，或手动指定）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))  # 脚本放在项目根目录（root）下
PROJECT_ROOT = SCRIPT_DIR  # 项目根目录（root）
EXTENSION_DIR = os.path.join(PROJECT_ROOT, "extension")  # 扩展根目录（包含 package.json）
DOC_DIR = os.path.join(PROJECT_ROOT, "extension", "docs")# 多语言文档目录

# 需要复制的文件列表（源文件名 -> 目标文件名，保持不变）
MOVE_FILES = os.listdir(DOC_DIR)

def copy_to_extension():
    """将多语言文档复制到 extension 根目录"""

    # 复制 README 文件
    for filename in MOVE_FILES:
        src = os.path.join(DOC_DIR, filename)
        dst = os.path.join(EXTENSION_DIR, filename)
        shutil.copy2(src, dst)
        print(f"已复制: {src} -> {dst}")

def clean_temp_docs():
    """打包完成后删除复制到 extension 根目录的文档文件，并将生成的vsix文件移动到项目根目录"""
    for filename in MOVE_FILES:
        file_path = os.path.join(EXTENSION_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"已删除临时文件: {file_path}")

def run_vsce_command(args, cwd):
    """执行 vsce 命令"""
    cmd = ["vsce.cmd"] + args
    print(f"执行命令: {' '.join(cmd)} (工作目录: {cwd})")
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False
        )
        if result.stdout:
            print("STDOUT:", result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr, file=sys.stderr)
        return result.returncode
    except FileNotFoundError:
        print("错误: 未找到 'vsce' 命令，请确保已全局安装 @vscode/vsce 并添加到 PATH",
              file=sys.stderr)
        return -1

def main():
    # 1. 复制多语言文档到扩展根目录
    print("=== 复制多语言文档 ===")
    copy_to_extension()

    # 2. 执行打包命令
    print("\n=== 开始打包扩展 ===")
    exit_code = run_vsce_command(["package"], cwd=EXTENSION_DIR)

    # 3. 打包完成后清理复制的临时文件（可选）
    print("\n=== 清理临时文档 ===")
    clean_temp_docs()

    if exit_code == 0:
        print(f"\n打包成功！")
    else:
        print(f"\n打包失败，退出码 {exit_code}")

if __name__ == "__main__":
    main()