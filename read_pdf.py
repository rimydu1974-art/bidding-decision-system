# -*- coding: utf-8 -*-
import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 尝试读取PDF版本
pdf_path = r'C:\Users\ips\Desktop\Upan\杭州非遗\杭州市文化两中心非遗数字展陈项目-招标文件整理.pdf'
output_path = r'C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\招标文件内容.txt'

try:
    doc = fitz.open(pdf_path)
    text = ''
    for page_num in range(len(doc)):
        page = doc[page_num]
        text += f'--- 第{page_num + 1}页 ---\n'
        text += page.get_text('text') + '\n'
    doc.close()
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f'成功! 共 {len(doc)} 页，{len(text)} 字符')
    print(f'已保存到: {output_path}')
    print(f'\n前5000字预览：')
    print(text[:5000])
except Exception as e:
    print(f'错误: {e}')
