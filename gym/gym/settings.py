"""
Compatibility shim: import settings from `gym_service`.

This file lets code that still imports `gym.settings` continue to work
while the project package has been renamed to `gym_service`.
"""

from gym_service.settings import *

