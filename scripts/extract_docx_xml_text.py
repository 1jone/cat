from pathlib import Path
import re
import sys
import zipfile
from xml.etree import ElementTree as ET


NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def iter_text_from_xml(data):
    root = ET.fromstring(data)
    for node in root.iter():
        if node.tag.endswith("}t") and node.text:
            yield node.text


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: extract_docx_xml_text.py <docx>")
    path = Path(sys.argv[1])
    with zipfile.ZipFile(path) as zf:
        names = [
            n for n in zf.namelist()
            if n.startswith("word/") and n.endswith(".xml")
        ]
        for name in names:
            text = "\n".join(iter_text_from_xml(zf.read(name)))
            text = re.sub(r"\n{3,}", "\n\n", text).strip()
            if text:
                print(f"=== {name} ===")
                print(text)


if __name__ == "__main__":
    main()
