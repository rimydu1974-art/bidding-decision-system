# -*- coding: utf-8 -*-
"""
Generate import data for OpenCheck
Output: import_data.json (for node import)
"""
import sqlite3
import json
import hashlib
import re
import os

db_path = r"C:\Users\ips\Desktop\测试AI员工能力\爬虫数据\yuanbo_crawler\data\yuanbo.db"
output_path = r"C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\bidding-decision-system\import_data.json"

print("Loading data from SQLite...")
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute("SELECT * FROM bid_announcements")
rows = [dict(row) for row in cursor.fetchall()]
conn.close()

print(f"Loaded {len(rows)} records")

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_budget(text):
    patterns = [r'预算[金额]*[:\s]*([0-9,.]+)\s*[万]?元', r'采购预算[:\s]*([0-9,.]+)']
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1)
    return ""

def extract_purchaser(text):
    patterns = [r'采购人[:\s]*([^\s<,，。]+)', r'招标人[:\s]*([^\s<,，。]+)']
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1)
    return ""

# 1. Generate Q&A data
print("Generating Q&A data...")
qa_data = []
for r in rows:
    desc = clean_text(r.get('description', ''))
    if len(desc) < 50:
        continue
    
    keyword = r.get('keyword', 'unknown')
    title = r.get('title', '')
    info_id = r.get('info_id', '')
    
    # Q1: Title
    qa_data.append({
        "id": hashlib.md5(f"{info_id}_title".encode()).hexdigest()[:12],
        "question": "这个招标项目的标题是什么？",
        "answer": title,
        "context": desc[:1000],
        "category": keyword,
    })
    
    # Q2: Budget
    budget = extract_budget(desc)
    if budget:
        qa_data.append({
            "id": hashlib.md5(f"{info_id}_budget".encode()).hexdigest()[:12],
            "question": "这个项目的预算是多少？",
            "answer": f"预算金额为{budget}元",
            "context": desc[:1000],
            "category": keyword,
        })
    
    # Q3: Purchaser
    purchaser = extract_purchaser(desc)
    if purchaser:
        qa_data.append({
            "id": hashlib.md5(f"{info_id}_purchaser".encode()).hexdigest()[:12],
            "question": "采购人是谁？",
            "answer": f"采购人是{purchaser}",
            "context": desc[:1000],
            "category": keyword,
        })

print(f"Generated {len(qa_data)} Q&A pairs")

# 2. Generate Case data
print("Generating Case data...")
case_data = []
for r in rows:
    desc = clean_text(r.get('description', ''))
    if len(desc) < 50:
        continue
    
    case_data.append({
        "id": hashlib.md5(r.get('info_id', '').encode()).hexdigest()[:12],
        "title": r.get('title', ''),
        "industry": r.get('keyword', ''),
        "content": desc,
        "summary": r.get('title', ''),
    })

print(f"Generated {len(case_data)} cases")

# 3. Extract Industry Rules
print("Extracting Industry Rules...")
rule_keywords = {
    "废标": ["废标", "无效投标", "无效报价", "否决", "不予受理", "取消资格"],
    "资格": ["资质", "证书", "认证", "ISO", "营业执照"],
    "评分": ["评分", "分数", "权重", "得分", "总分"],
    "格式": ["密封", "盖章", "签字", "包装", "份数"],
    "财务": ["保证金", "预算", "最高限价", "付款"],
    "时间": ["截止", "开标", "公告", "工期"],
}

industry_rules = []
for keyword in ["办公用品", "医疗服务", "教育培训", "物业服务", "养老服务", "环保监测", "三维模型"]:
    for category, kws in rule_keywords.items():
        matching_records = []
        for r in rows:
            if r.get('keyword') != keyword:
                continue
            desc = clean_text(r.get('description', ''))
            if any(kw in desc for kw in kws):
                matching_records.append(desc[:200])
        
        if matching_records:
            content = f"行业：{keyword}\n"
            content += f"规则类型：{category}\n"
            content += f"相关案例数：{len(matching_records)}\n"
            content += f"示例：{matching_records[0][:100]}"
            
            industry_rules.append({
                "id": hashlib.md5(f"{keyword}_{category}".encode()).hexdigest()[:12],
                "category": category,
                "title": f"{keyword}-{category}规则",
                "content": content,
                "industry": keyword,
            })

print(f"Extracted {len(industry_rules)} industry rules")

# 4. Save
output = {
    "systemUser": {
        "email": "system@opencheck.com",
        "name": "系统知识库",
        "role": "admin",
    },
    "knowledgeItems": qa_data,
    "cases": case_data,
    "industryRules": industry_rules,
}

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output_path}")
print(f"Summary:")
print(f"  KnowledgeItem (Q&A): {len(qa_data)}")
print(f"  Case: {len(case_data)}")
print(f"  IndustryRule: {len(industry_rules)}")
