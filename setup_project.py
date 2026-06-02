"""
一键创建项目目录结构（Windows/Mac/Linux 通用）
"""
from pathlib import Path


def create_project():
    base = Path(__file__).parent

    # 目录结构
    dirs = [
        "backend/app",
        "data",
        "frontend/src/components",
        "frontend/src/hooks",
    ]

    # 空文件
    files = [
        "backend/__init__.py",
        "backend/main.py",
        "backend/data_loader.py",
        "backend/requirements.txt",
        "backend/app/__init__.py",
        "backend/app/api.py",
        "frontend/package.json",
        "frontend/vite.config.ts",
        "frontend/tsconfig.json",
        "frontend/tsconfig.node.json",
        "frontend/index.html",
        "frontend/src/main.tsx",
        "frontend/src/App.tsx",
        "frontend/src/components/Dashboard.tsx",
        "frontend/src/hooks/use3PLData.ts",
        ".gitignore",
        "README.md",
    ]

    # 创建目录
    for d in dirs:
        (base / d).mkdir(parents=True, exist_ok=True)
        print(f"📁 创建目录: {d}")

    # 创建文件
    for f in files:
        (base / f).touch(exist_ok=True)
        print(f"📄 创建文件: {f}")

    print("\n✅ 项目结构创建完成！")
    print(f"📍 项目路径: {base.absolute()}")


if __name__ == "__main__":
    create_project()