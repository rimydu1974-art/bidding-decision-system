# -*- coding: utf-8 -*-
"""
OpenCheck 数据导入脚本
将本地知识库数据导入到 Supabase PostgreSQL
"""
import json
import os
import uuid
from datetime import datetime

# 使用 Prisma Client (Node.js)
# 通过子进程调用 Node.js 脚本执行数据库操作

KNOWLEDGE_DIR = r"C:\Users\ips\Desktop\测试AI员工能力\爬虫数据\yuanbo_crawler\opencheck_rag\knowledge"
QA_FILE = os.path.join(KNOWLEDGE_DIR, "opencheck_qa_train.jsonl")
KB_FILE = os.path.join(KNOWLEDGE_DIR, "knowledge_base.json")

# 输出 Node.js 脚本
NODE_SCRIPT = r"C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\bidding-decision-system\import_data.js"


def generate_cuid():
    """生成 Cuid 格式的 ID"""
    return "c" + uuid.uuid4().hex[:24]


def prepare_qa_data():
    """准备 Q&A 数据"""
    print("读取 Q&A 数据...")
    qa_data = []
    
    with open(QA_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            qa_data.append(item)
    
    print(f"  读取 {len(qa_data)} 条 Q&A 记录")
    return qa_data


def prepare_kb_data():
    """准备知识库数据"""
    print("读取知识库数据...")
    with open(KB_FILE, "r", encoding="utf-8") as f:
        kb_data = json.load(f)
    
    print(f"  读取 {len(kb_data)} 条知识库记录")
    return kb_data


def generate_node_script(qa_data, kb_data):
    """生成 Node.js 导入脚本"""
    
    # 转换 Q&A 数据为 KnowledgeItem 格式
    knowledge_items = []
    for item in qa_data:
        knowledge_items.append({
            "id": generate_cuid(),
            "title": item.get("instruction", "")[:100],
            "category": item.get("category", "未分类"),
            "content": f"问题：{item.get('instruction', '')}\n上下文：{item.get('input', '')[:500]}\n回答：{item.get('output', '')}",
            "tags": json.dumps(["招标", "Q&A", item.get("category", "")]),
            "fileType": "text",
            "source": "opencheck_import",
            "metadata": json.dumps({"type": "qa", "original_category": item.get("category", "")}),
        })
    
    # 转换知识库数据为 Case 格式
    cases = []
    for item in kb_data:
        cases.append({
            "id": generate_cuid(),
            "title": item.get("title", "")[:200],
            "source": "platform",
            "industry": item.get("category", "其他"),
            "content": item.get("content", "")[:5000],
            "summary": item.get("title", ""),
            "status": "published",
            "isPublic": False,
            "tags": json.dumps([item.get("category", ""), "招标公告"]),
        })
    
    # 生成 Node.js 脚本
    script = f"""
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();

const knowledgeItems = {json.dumps(knowledge_items, ensure_ascii=False)};
const cases = {json.dumps(cases, ensure_ascii=False)};

async function main() {{
    console.log('开始导入数据...');
    
    // 获取第一个用户 ID
    const user = await prisma.user.findFirst();
    if (!user) {{
        console.error('没有找到用户，请先创建用户');
        process.exit(1);
    }}
    console.log('使用用户:', user.id, user.email);
    
    // 导入 Q&A 到 KnowledgeItem
    console.log('导入 Q&A 数据到 KnowledgeItem...');
    let qaCount = 0;
    for (const item of knowledgeItems) {{
        try {{
            await prisma.knowledgeItem.create({{
                data: {{
                    ...item,
                    userId: user.id,
                }}
            }});
            qaCount++;
            if (qaCount % 1000 === 0) {{
                console.log('  已导入 Q&A:', qaCount);
            }}
        }} catch (e) {{
            // 忽略重复错误
            if (!e.message.includes('Unique constraint')) {{
                console.error('Q&A 导入错误:', e.message);
            }}
        }}
    }}
    console.log('Q&A 导入完成:', qaCount, '条');
    
    // 导入案例到 Case
    console.log('导入招标案例到 Case...');
    let caseCount = 0;
    for (const item of cases) {{
        try {{
            await prisma.case.create({{
                data: item
            }});
            caseCount++;
            if (caseCount % 1000 === 0) {{
                console.log('  已导入案例:', caseCount);
            }}
        }} catch (e) {{
            if (!e.message.includes('Unique constraint')) {{
                console.error('Case 导入错误:', e.message);
            }}
        }}
    }}
    console.log('案例导入完成:', caseCount, '条');
    
    // 统计
    const totalKnowledge = await prisma.knowledgeItem.count({{
        where: {{ source: 'opencheck_import' }}
    }});
    const totalCases = await prisma.case.count({{
        where: {{ source: 'platform' }}
    }});
    
    console.log('\\n导入统计:');
    console.log('  KnowledgeItem (Q&A):', totalKnowledge, '条');
    console.log('  Case (招标案例):', totalCases, '条');
    
    await prisma.$disconnect();
    console.log('\\n导入完成！');
}}

main().catch(e => {{
    console.error(e);
    process.exit(1);
}});
"""
    
    with open(NODE_SCRIPT, "w", encoding="utf-8") as f:
        f.write(script)
    
    print(f"Node.js 脚本已生成: {NODE_SCRIPT}")


def main():
    print("=" * 60)
    print("OpenCheck 数据导入")
    print("=" * 60)
    
    # 准备数据
    qa_data = prepare_qa_data()
    kb_data = prepare_kb_data()
    
    # 生成 Node.js 脚本
    print("\n生成导入脚本...")
    generate_node_script(qa_data, kb_data)
    
    print("\n" + "=" * 60)
    print("准备完成！")
    print("=" * 60)
    print(f"\n请运行以下命令执行导入:")
    print(f"  cd C:\\Users\\ips\\Desktop\\测试AI员工能力\\重做投标网站\\bidding-decision-system")
    print(f"  node import_data.js")


if __name__ == "__main__":
    main()
