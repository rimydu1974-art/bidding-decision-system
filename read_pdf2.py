# -*- coding: utf-8 -*-
import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'C:\Users\ips\Desktop\Upan\杭州非遗\杭州市文化两中心非遗数字展陈项目-招标文件整理.pdf'
output_path = r'C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\招标文件内容.txt'

doc = fitz.open(pdf_path)
page_count = len(doc)
print(f'PDF共 {page_count} 页')

text = ''
for page_num in range(page_count):
    page = doc.load_page(page_num)
    page_text = page.get_text('text')
    text += f'--- 第{page_num + 1}页 ---\n'
    text += page_text + '\n'

doc.close()

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(text)

print(f'已提取 {len(text)} 字符')
print(f'保存到: {output_path}')
print(f'\n前5000字预览：')
print(text[:5000])
