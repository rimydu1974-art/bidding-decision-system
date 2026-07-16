# -*- coding: utf-8 -*-
import shutil
import os

src = r'C:\Users\ips\Desktop\Upan\杭州非遗\定稿-招标文件-杭州市"文化两中心"非遗数字展陈内容制作及相关配套项目.docx'
dst = r'C:\Users\ips\Desktop\测试AI员工能力\重做投标网站\tender-doc.docx'

try:
    shutil.copy2(src, dst)
    print(f'文件已复制到: {dst}')
    print(f'文件大小: {os.path.getsize(dst)} bytes')
except Exception as e:
    print(f'复制失败: {e}')
    # 尝试列出目录内容
    dir_path = r'C:\Users\ips\Desktop\Upan\杭州非遗'
    print(f'\n目录 {dir_path} 内容:')
    if os.path.exists(dir_path):
        for f in os.listdir(dir_path):
            print(f'  {f}')
    else:
        print('  目录不存在')
