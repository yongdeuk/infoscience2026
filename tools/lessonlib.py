"""차시 페이지용: 단원 본문을 소단원·덩어리 단위로 잘라 낸다 (build.py 와 저작 도구가 함께 쓴다)."""
import re
from html.parser import HTMLParser

VOID = {"br", "img", "input", "hr", "meta", "link", "wbr", "col", "area", "source"}


class _Top(HTMLParser):
    """article 의 직계 자식 요소들의 [시작, 끝) 위치를 모은다."""
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.text, self.d, self.kids, self.start = text, 0, [], None
        self.lines = [0]
        for m in re.finditer("\n", text):
            self.lines.append(m.end())

    def off(self):
        ln, col = self.getpos()
        return self.lines[ln - 1] + col

    def handle_starttag(self, tag, attrs):
        if self.d == 0 and tag not in VOID:
            self.start = (self.off(), tag)
        elif self.d == 0:
            self.kids.append((tag, self.off(), self.off() + len(self.get_starttag_text())))
        if tag not in VOID:
            self.d += 1

    def handle_startendtag(self, tag, attrs):
        if self.d == 0:
            self.kids.append((tag, self.off(), self.off() + len(self.get_starttag_text())))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        self.d -= 1
        if self.d == 0 and self.start:
            end = self.text.index(">", self.off()) + 1
            self.kids.append((self.start[1], self.start[0], end))
            self.start = None


def kids(html):
    p = _Top(html)
    p.feed(html)
    return [(t, html[a:b]) for t, a, b in p.kids]


def topic_bodies(unit_html):
    """{topic_id: (h3 html, 본문 html)}"""
    out = {}
    for m in re.finditer(r'<article class="topic" id="(t\d-\d+)">\s*<h3>(.*?)</h3>(.*?)\n\s*</article>', unit_html, re.S):
        out[m.group(1)] = (m.group(2), m.group(3))
    return out


CAP = '<span class="lbl">역량 키우기 · 수행 활동</span>'


def chunks(body):
    """본문을 h4 기준 덩어리로: [0]=첫 h4 앞, [k]=k번째 h4부터. 역량 키우기 수행 활동은 따로 뺀다(!c)."""
    parts = [[]]
    for tag, h in kids(body):
        if CAP in h[:200]:
            continue
        if tag == "h4":
            parts.append([])
        parts[-1].append(h)
    return ["\n".join(p) for p in parts]


def problems(body):
    """연습 문제 소단원의 문제(div.q)들."""
    qs = []
    for tag, h in kids(body):
        if 'class="quiz"' in h[:40]:
            qs += [x for t, x in kids(h[h.index(">") + 1:h.rindex("<")]) if x.startswith('<div class="q"')]
    return qs


def section(bodies, ref):
    m = re.match(r"(t\d-\d+)(?::(\d+)|#(\d+)|(!c))?$", ref)
    tid, ch, q = m.group(1), m.group(2), m.group(3)
    body = bodies[tid][1]
    if m.group(4):
        return "\n".join(h for t, h in kids(body) if CAP in h[:200])
    if ch is not None:
        return chunks(body)[int(ch)]
    if q is not None:
        return problems(body)[int(q) - 1]
    return body
