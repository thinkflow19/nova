import unittest

class SimpleTest(unittest.TestCase):
    def test_simple(self):
        print("Running simple test")
        self.assertEqual(1, 1)

if __name__ == "__main__":
    print("Starting simple test")
    unittest.main() 