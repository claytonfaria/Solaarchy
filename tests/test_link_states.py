import unittest
from solaarchy_common import LinkStates


class LinkStatesTests(unittest.TestCase):
    def test_duplicates_and_transitions(self):
        state = LinkStates()
        self.assertTrue(state.changed('/dev/hidraw3', 2, True))
        for _ in range(1000):
            self.assertFalse(state.changed('/dev/hidraw3', 2, True))
        self.assertTrue(state.changed('/dev/hidraw3', 2, False))
        self.assertFalse(state.changed('/dev/hidraw3', 2, False))
        self.assertTrue(state.changed('/dev/hidraw3', 2, True))

    def test_receivers_and_slots_are_independent(self):
        state = LinkStates()
        for path, slot in [('a', 1), ('a', 2), ('b', 1)]:
            self.assertTrue(state.changed(path, slot, True))
        state.remove('a')
        self.assertTrue(state.changed('a', 1, True))
        self.assertTrue(state.changed('a', 2, True))
        self.assertFalse(state.changed('b', 1, True))

    def test_unplug_does_not_accumulate_history(self):
        state = LinkStates()
        for i in range(1000):
            state.changed(str(i), 1, True)
            state.remove(str(i))
        self.assertEqual(state._paths, {})
