// Create mock functions
const setNotificationHandler = jest.fn();
const getPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));
const requestPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));
const scheduleNotificationAsync = jest.fn(() => Promise.resolve('notification-id'));
const getAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve([]));
const cancelAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve());
const cancelScheduledNotificationAsync = jest.fn(() => Promise.resolve());
const getPresentedNotificationsAsync = jest.fn(() => Promise.resolve([]));
const dismissNotificationAsync = jest.fn(() => Promise.resolve());
const dismissAllNotificationsAsync = jest.fn(() => Promise.resolve());
const addNotificationReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
const addNotificationResponseReceivedListener = jest.fn(() => ({ remove: jest.fn() }));
const addNotificationsDroppedListener = jest.fn(() => ({ remove: jest.fn() }));
const removeNotificationSubscription = jest.fn();
const setNotificationChannelAsync = jest.fn(() => Promise.resolve());
const getNotificationChannelAsync = jest.fn(() => Promise.resolve(null));
const deleteNotificationChannelAsync = jest.fn(() => Promise.resolve());
const getNotificationChannelsAsync = jest.fn(() => Promise.resolve([]));
const setBadgeCountAsync = jest.fn(() => Promise.resolve());
const getBadgeCountAsync = jest.fn(() => Promise.resolve(0));
const presentNotificationAsync = jest.fn(() => Promise.resolve('notification-id'));

const mockNotifications = {
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  getAllScheduledNotificationsAsync,
  cancelAllScheduledNotificationsAsync,
  cancelScheduledNotificationAsync,
  getPresentedNotificationsAsync,
  dismissNotificationAsync,
  dismissAllNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  addNotificationsDroppedListener,
  removeNotificationSubscription,
  setNotificationChannelAsync,
  getNotificationChannelAsync,
  deleteNotificationChannelAsync,
  getNotificationChannelsAsync,
  setBadgeCountAsync,
  getBadgeCountAsync,
  presentNotificationAsync,
};

// Export notification trigger types
const NotificationTrigger = {
  CALENDAR: 'calendar',
  INTERVAL: 'interval',
  DATE: 'date',
};

// Use module.exports for better compatibility with jest mocking
module.exports = mockNotifications;
module.exports.setNotificationHandler = setNotificationHandler;
module.exports.getPermissionsAsync = getPermissionsAsync;
module.exports.requestPermissionsAsync = requestPermissionsAsync;
module.exports.scheduleNotificationAsync = scheduleNotificationAsync;
module.exports.getAllScheduledNotificationsAsync = getAllScheduledNotificationsAsync;
module.exports.cancelAllScheduledNotificationsAsync = cancelAllScheduledNotificationsAsync;
module.exports.cancelScheduledNotificationAsync = cancelScheduledNotificationAsync;
module.exports.getPresentedNotificationsAsync = getPresentedNotificationsAsync;
module.exports.dismissNotificationAsync = dismissNotificationAsync;
module.exports.dismissAllNotificationsAsync = dismissAllNotificationsAsync;
module.exports.addNotificationReceivedListener = addNotificationReceivedListener;
module.exports.addNotificationResponseReceivedListener = addNotificationResponseReceivedListener;
module.exports.addNotificationsDroppedListener = addNotificationsDroppedListener;
module.exports.removeNotificationSubscription = removeNotificationSubscription;
module.exports.setNotificationChannelAsync = setNotificationChannelAsync;
module.exports.getNotificationChannelAsync = getNotificationChannelAsync;
module.exports.deleteNotificationChannelAsync = deleteNotificationChannelAsync;
module.exports.getNotificationChannelsAsync = getNotificationChannelsAsync;
module.exports.setBadgeCountAsync = setBadgeCountAsync;
module.exports.getBadgeCountAsync = getBadgeCountAsync;
module.exports.presentNotificationAsync = presentNotificationAsync;
module.exports.NotificationTrigger = NotificationTrigger;