import AsyncStorage from "@react-native-community/async-storage";

export const saveData = async (key, token) => {
  try {
    await AsyncStorage.setItem(key, token);
  } catch (error) {
    console.log("Save Fail: ", error);
  }
};

export const getStorageData = async key => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value != null) return value;
  } catch (error) {
    console.log("Get Fail: ", error);
  }
};

export const removeData = async key => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log("Remove Fail: ", error);
  }
};
