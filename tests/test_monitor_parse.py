"""Test report parsing without importing Solaar or opening hardware."""
import ast
from pathlib import Path
import unittest

source = ast.parse((Path(__file__).resolve().parents[1] / 'solaarchy-monitor.py').read_text())
parse_node = next(n for n in source.body if isinstance(n, ast.FunctionDef) and n.name == 'parse')
namespace = dict(HIDPP_SHORT=0x10, HIDPP_LONG=0x11, DJ_REPORT=0x20,
                 DJ_PAIRING=0x41, DJ_CONNECTED=0x42, EX100_ADDRESS=0x02)
exec(compile(ast.Module(body=[parse_node], type_ignores=[]), '<monitor parse>', 'exec'), namespace)
parse = namespace['parse']


class MonitorParseTests(unittest.TestCase):
    def test_unpair_is_offline(self):
        self.assertEqual(parse(bytes([0x10, 2, 0x40, 2, 0, 0, 0])), (2, False))

    def test_link_transitions(self):
        self.assertEqual(parse(bytes([0x10, 2, 0x41, 4, 0, 0, 0])), (2, True))
        self.assertEqual(parse(bytes([0x10, 2, 0x41, 4, 0x40, 0, 0])), (2, False))

    def test_other_reports_ignored(self):
        self.assertIsNone(parse(b''))
        self.assertIsNone(parse(bytes([0x10, 2, 0x40, 1, 0, 0, 0])))
        self.assertIsNone(parse(bytes([0x10, 2, 0x12, 2, 0, 0, 0])))
