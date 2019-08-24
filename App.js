import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import Ins from "react-native-instagram-login";

import Share from "react-native-share";
import LinearGradient from "react-native-linear-gradient";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;
const instaIcon = require("./assets/link.png");
const syncIcon = require("./assets/sync.png");
const firstDesc = require("./assets/first_desc.png");
const secondDesc = require("./assets/second_desc.png");
const thirdDesc = require("./assets/third_desc.png");
const fourthDesc = require("./assets/fourth_desc.png");
const titleImg = require("./assets/title.png");
const leftArrow = require("./assets/left_arrow.png");
const rightArrow = require("./assets/right_arrow.png");

const accessToken = "16952020370.9b38baa.28f0c2e80b4041fda87bd2241ce0e5e4";

import Icon from "react-native-vector-icons/Ionicons";

import * as Storage from "./storage";

let Users = [
  {
    id: "0",
    uri: require("./assets/resto1.jpg"),
    name: "Horn's",
    city: "Vitry sur seine",
    price: "€€",
    link: "https://www.instagram.com/p/ByDHQmaoaDD/?utm_source=ig_web_copy_link"
  },
  {
    id: "1",
    uri: require("./assets/resto2.jpg"),
    name: "El marsaa",
    city: "Ivry sur seine",
    price: "€",
    link: "https://www.instagram.com/p/Bycm8mjoYW9/?igshid=y3dottqplstf"
  },
  {
    id: "2",
    uri: require("./assets/resto3.jpg"),
    name: "Cuistot braisé",
    city: "Saint Denis",
    price: "€",
    link: "https://www.instagram.com/p/B0EJ_dNocKQ/?igshid=15khu9p0fan62"
  }
];

export default class App extends React.Component {
  constructor() {
    super();

    this.position = new Animated.ValueXY();
    this.state = {
      currentIndex: 0,
      users: [],
      instaToken: accessToken,
      instaData: null,
      loading: false,
      isMainScreen: false
    };

    this.rotate = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ["-30deg", "0deg", "10deg"],
      extrapolate: "clamp"
    });

    this.rotateAndTranslate = {
      transform: [
        {
          rotate: this.rotate
        },
        ...this.position.getTranslateTransform()
      ]
    };

    this.likeOpacity = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [0, 0, 1],
      extrapolate: "clamp"
    });
    this.dislikeOpacity = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [1, 0, 0],
      extrapolate: "clamp"
    });

    this.nextCardOpacity = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [1, 0, 1],
      extrapolate: "clamp"
    });
    this.nextCardScale = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [1, 0.8, 1],
      extrapolate: "clamp"
    });

    this.onPressInstaSync = this.onPressInstaSync.bind(this);
  }

  componentDidMount = async () => {
    this.fetchInstaFeed();
    await Storage.getStorageData("@Foodstagram_token").then(result => {
      this.setState({
        isMainScreen: typeof result === "string"
      });
    });
  };

  componentWillMount = async () => {
    this.PanResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderMove: (evt, gestureState) => {
        this.position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          Animated.spring(this.position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gestureState.dy }
          }).start(() => {
            this.setState({ currentIndex: this.state.currentIndex + 1 }, () => {
              this.position.setValue({ x: 0, y: 0 });

              //  compteur++;

              if (this.state.isMainScreen) {
                this.shareToWhatsApp(
                  this.state.users[this.state.currentIndex - 1]
                );
                if (this.state.users.length === this.state.currentIndex) {
                  this.setState({
                    currentIndex: 0
                  });
                  this.reorderUsers(this.state.users);
                }
              } else {
                if (Users.length === this.state.currentIndex) {
                  this.setState({
                    currentIndex: 0,
                    isMainScreen: true
                  });
                  this.fetchInstaFeed();
                  Storage.saveData("@Foodstagram_token", "Foodstagram");
                }
              }

              //  Linking.openURL(`whatsapp://send?text=RDV à Mama Jackson au 12 Rue Claude Tillier, 75012 Paris ${Users.name}`);
            });
          });
        } else if (gestureState.dx < -120) {
          Animated.spring(this.position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gestureState.dy }
          }).start(() => {
            this.setState({ currentIndex: this.state.currentIndex + 1 }, () => {
              this.position.setValue({ x: 0, y: 0 });
              if (this.state.isMainScreen) {
                if (this.state.users.length === this.state.currentIndex) {
                  this.setState({
                    currentIndex: 0
                  });
                  this.reorderUsers(this.state.users);
                }
              } else {
                if (Users.length === this.state.currentIndex) {
                  this.setState({
                    currentIndex: 0,
                    isMainScreen: true
                  });
                  this.fetchInstaFeed();
                  Storage.saveData("@Foodstagram_token", "Foodstagram");
                }
              }
            });
          });
        } else {
          Animated.spring(this.position, {
            toValue: { x: 0, y: 0 },
            friction: 4
          }).start();
        }
      }
    });
  };

  getBase64ImageFromUrl = async imageUrl => {
    var res = await fetch(imageUrl);
    var blob = await res.blob();

    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener(
        "load",
        function() {
          resolve(reader.result);
        },
        false
      );

      reader.onerror = () => {
        return reject(this);
      };
      reader.readAsDataURL(blob);
    });
  };

  shareToWhatsApp = async item => {
    // const base64data = await RNFS.readFile("./assets/2.png", "base64").then();
    console.log("+=--: ", `${item.name}, ${item.link}`);
    await this.setState({ loading: true });
    // in order to send only message, need to remove url option.
    await this.getBase64ImageFromUrl(`${item.uri}`)
      .then(result => {
        // console.log("----: ", result);
        let shareOptions = {
          title: "Testing",
          // url: `data:image/png;${result.substring(30, result.length)}`,
          message: `${item.name}, ${item.link}`,
          subject: "Subject",
          social: "whatsapp"
        };
        Share.shareSingle(shareOptions);
        this.setState({ loading: false });
      })
      .catch(err => {
        console.error(err);
        this.setState({ loading: false });
      });
  };

  sort = (a, b) => {
    return 0.5 - Math.random();
  };

  reorderUsers = users => {
    let tmpUsers = users.sort(this.sort);
    this.setState({
      users: tmpUsers
    });
  };

  reorderTutorUsers = () => {
    let tmpUsers = Users.sort(this.sort);
    Users = tmpUsers;
  };

  renderUsers = () => {
    const { users } = this.state;
    if (users.length === 0) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 25, fontWeight: "bold" }}>
            Please link instagram images
          </Text>
        </View>
      );
    } else {
      return users
        .map((item, i) => {
          if (i < this.state.currentIndex) {
            return null;
          } else if (i == this.state.currentIndex) {
            return (
              <Animated.View
                {...this.PanResponder.panHandlers}
                key={item.id}
                style={[
                  this.rotateAndTranslate,
                  {
                    height: SCREEN_HEIGHT - 120,
                    width: SCREEN_WIDTH,
                    padding: 10,
                    position: "absolute"
                  }
                ]}
              >
                <Animated.View
                  style={{
                    opacity: this.likeOpacity,
                    transform: [{ rotate: "-30deg" }],
                    position: "absolute",
                    top: 50,
                    left: 40,
                    zIndex: 1000
                  }}
                >
                  <Text
                    style={{
                      borderWidth: 1,
                      borderColor: "green",
                      color: "green",
                      fontSize: 32,
                      fontWeight: "800",
                      padding: 10
                    }}
                  >
                    LIKE
                  </Text>
                </Animated.View>

                <Animated.View
                  style={{
                    opacity: this.dislikeOpacity,
                    transform: [{ rotate: "30deg" }],
                    position: "absolute",
                    top: 50,
                    right: 40,
                    zIndex: 1000
                  }}
                >
                  <Text
                    style={{
                      borderWidth: 1,
                      borderColor: "red",
                      color: "red",
                      fontSize: 32,
                      fontWeight: "800",
                      padding: 10
                    }}
                  >
                    NOPE
                  </Text>
                </Animated.View>

                <Image
                  style={{
                    flex: 0.75,
                    // height: null,
                    width: "100%",
                    resizeMode: "cover",
                    borderRadius: 20
                  }}
                  source={{ uri: item.uri }}
                />
                <View
                  style={{
                    flex: 0.125,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#ffe8ee",
                    borderRadius: 8,
                    marginTop: 8
                  }}
                >
                  <Text
                    style={{
                      fontSize: 30,
                      fontWeight: "bold",
                      color: "#561a00"
                    }}
                  >
                    {item.name}
                  </Text>
                </View>
                <View
                  style={{ flex: 0.125, flexDirection: "row", marginTop: 8 }}
                >
                  <View
                    style={{
                      flex: 0.75,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#ffe8ee",
                      borderRadius: 8,
                      marginRight: 4
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 25,
                        fontWeight: "bold",
                        color: "#561a00"
                      }}
                    >
                      {item.city}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 0.25,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#ffe8ee",
                      borderRadius: 8,
                      marginLeft: 4
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 25,
                        fontWeight: "bold",
                        color: "#561a00"
                      }}
                    >
                      {item.price}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          } else {
            return (
              <Animated.View
                key={item.id}
                style={[
                  {
                    opacity: this.nextCardOpacity,
                    transform: [{ scale: this.nextCardScale }],
                    height: SCREEN_HEIGHT - 120,
                    width: SCREEN_WIDTH,
                    padding: 10,
                    position: "absolute"
                  }
                ]}
              >
                <Animated.View
                  style={{
                    opacity: 0,
                    transform: [{ rotate: "-30deg" }],
                    position: "absolute",
                    top: 50,
                    left: 40,
                    zIndex: 1000
                  }}
                >
                  <Text
                    style={{
                      borderWidth: 1,
                      borderColor: "green",
                      color: "green",
                      fontSize: 32,
                      fontWeight: "800",
                      padding: 10
                    }}
                  >
                    LIKE
                  </Text>
                </Animated.View>

                <Animated.View
                  style={{
                    opacity: 0,
                    transform: [{ rotate: "30deg" }],
                    position: "absolute",
                    top: 50,
                    right: 40,
                    zIndex: 1000
                  }}
                >
                  <Text
                    style={{
                      borderWidth: 1,
                      borderColor: "red",
                      color: "red",
                      fontSize: 32,
                      fontWeight: "800",
                      padding: 10
                    }}
                  >
                    NOPE
                  </Text>
                </Animated.View>

                <Image
                  style={{
                    flex: 0.75,
                    // height: null,
                    width: "100%",
                    resizeMode: "cover",
                    borderRadius: 20
                  }}
                  source={{ uri: item.uri }}
                />
                {i === this.state.currentIndex + 1 && (
                  <View style={{ flex: 0.25 }}>
                    <View
                      style={{
                        flex: 0.5,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#ffe8ee",
                        borderRadius: 8,
                        marginTop: 8
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 30,
                          fontWeight: "bold",
                          color: "#561a00"
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 0.5,
                        flexDirection: "row",
                        backgroundColor: "#ffe8ee",
                        borderRadius: 8,
                        marginTop: 8
                      }}
                    >
                      <View
                        style={{
                          flex: 0.75,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#ffe8ee",
                          borderRadius: 8
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 25,
                            fontWeight: "bold",
                            color: "#561a00"
                          }}
                        >
                          {item.city}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: 8,
                          height: "100%",
                          backgroundColor: "#f84040"
                        }}
                      />
                      <View
                        style={{
                          flex: 0.25,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#ffe8ee",
                          borderRadius: 8
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 25,
                            fontWeight: "bold",
                            color: "#561a00"
                          }}
                        >
                          {item.price}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </Animated.View>
            );
          }
        })
        .reverse();
    }
  };

  renderTutor = () => {
    const { currentIndex } = this.state;
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            flex: 0.2,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 30,
            marginRight: 30,
            marginTop: 30
          }}
        >
          <Image
            source={
              currentIndex === 0
                ? firstDesc
                : currentIndex === 1
                ? secondDesc
                : thirdDesc
            }
            style={
              currentIndex === 0
                ? { width: "100%", height: "100%" }
                : { width: "100%", height: "70%" }
            }
            resizeMode="stretch"
          />
        </View>
        <View
          style={{
            flex: 0.7,
            marginLeft: 50,
            marginRight: 50,
            marginTop: 30
          }}
        >
          {Users.map((item, i) => {
            if (i < this.state.currentIndex) {
              return null;
            } else if (i == this.state.currentIndex) {
              return (
                <Animated.View
                  {...this.PanResponder.panHandlers}
                  key={item.id}
                  style={[
                    this.rotateAndTranslate,
                    {
                      width: "100%",
                      height: "100%",
                      padding: 10,
                      position: "absolute"
                    }
                  ]}
                >
                  <Animated.View
                    style={{
                      opacity: this.likeOpacity,
                      transform: [{ rotate: "-30deg" }],
                      position: "absolute",
                      top: 50,
                      left: 40,
                      zIndex: 1000
                    }}
                  >
                    <Image
                      source={rightArrow}
                      style={{
                        borderWidth: 1,
                        borderColor: "green",
                        width: 60,
                        height: 40
                      }}
                    />
                  </Animated.View>

                  <Animated.View
                    style={{
                      opacity: this.dislikeOpacity,
                      transform: [{ rotate: "30deg" }],
                      position: "absolute",
                      top: 50,
                      right: 40,
                      zIndex: 1000
                    }}
                  >
                    <Image
                      source={leftArrow}
                      style={{
                        borderWidth: 1,
                        borderColor: "green",
                        width: 60,
                        height: 40
                      }}
                    />
                  </Animated.View>

                  <Image
                    style={{
                      flex: 0.75,
                      // height: null,
                      width: "100%",
                      resizeMode: "cover",
                      borderRadius: 20
                    }}
                    source={item.uri}
                  />
                  <View
                    style={{
                      flex: 0.125,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#ffe8ee",
                      borderRadius: 8,
                      marginTop: 8
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: "#561a00"
                      }}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 0.125,
                      flexDirection: "row",
                      marginTop: 8
                    }}
                  >
                    <View
                      style={{
                        flex: 0.75,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#ffe8ee",
                        borderRadius: 8,
                        marginRight: 4
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#561a00"
                        }}
                      >
                        {item.city}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 0.25,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#ffe8ee",
                        borderRadius: 8,
                        marginLeft: 4
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#561a00"
                        }}
                      >
                        {item.price}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            } else {
              return (
                <Animated.View
                  key={item.id}
                  style={[
                    {
                      opacity: this.nextCardOpacity,
                      transform: [{ scale: this.nextCardScale }],
                      width: "100%",
                      height: "100%",
                      padding: 10,
                      position: "absolute"
                    }
                  ]}
                >
                  <Animated.View
                    style={{
                      opacity: 0,
                      transform: [{ rotate: "-30deg" }],
                      position: "absolute",
                      top: 50,
                      left: 40,
                      zIndex: 1000
                    }}
                  >
                    <Image
                      source={rightArrow}
                      style={{
                        borderWidth: 1,
                        borderColor: "green",
                        width: 60,
                        height: 40
                      }}
                    />
                  </Animated.View>

                  <Animated.View
                    style={{
                      opacity: 0,
                      transform: [{ rotate: "30deg" }],
                      position: "absolute",
                      top: 50,
                      right: 40,
                      zIndex: 1000
                    }}
                  >
                    <Image
                      source={leftArrow}
                      style={{
                        borderWidth: 1,
                        borderColor: "green",
                        width: 60,
                        height: 40
                      }}
                    />
                  </Animated.View>

                  <Image
                    style={{
                      flex: 0.75,
                      // height: null,
                      width: "100%",
                      resizeMode: "cover",
                      borderRadius: 20
                    }}
                    source={item.uri}
                  />
                  {i === this.state.currentIndex + 1 &&
                    this.state.currentIndex !== 2 && (
                      <View style={{ flex: 0.25 }}>
                        <View
                          style={{
                            flex: 0.5,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#ffe8ee",
                            borderRadius: 8,
                            marginTop: 8
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 20,
                              fontWeight: "bold",
                              color: "#561a00"
                            }}
                          >
                            {item.name}
                          </Text>
                        </View>
                        <View
                          style={{
                            flex: 0.5,
                            flexDirection: "row",
                            backgroundColor: "#ffe8ee",
                            borderRadius: 8,
                            marginTop: 8
                          }}
                        >
                          <View
                            style={{
                              flex: 0.75,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: "#ffe8ee",
                              borderRadius: 8,
                              marginRight: 4
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "bold",
                                color: "#561a00"
                              }}
                            >
                              {item.city}
                            </Text>
                          </View>
                          <View
                            style={{
                              flex: 0.25,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: "#ffe8ee",
                              borderRadius: 8,
                              marginLeft: 4
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "bold",
                                color: "#561a00"
                              }}
                            >
                              {item.price}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                </Animated.View>
              );
            }
          }).reverse()}
        </View>
        <View
          style={{
            flex: 0.1,
            marginBottom: 20,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <View
            style={
              this.state.currentIndex === 0
                ? {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    margin: 5,
                    backgroundColor: "#b352ff"
                  }
                : {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    margin: 5,
                    backgroundColor: "#e3c0fc"
                  }
            }
          />
          <View
            style={
              this.state.currentIndex === 1
                ? {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    margin: 5,
                    backgroundColor: "#b352ff"
                  }
                : {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    margin: 5,
                    backgroundColor: "#e3c0fc"
                  }
            }
          />
          <View
            style={
              this.state.currentIndex === 2
                ? {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    margin: 5,
                    backgroundColor: "#b352ff"
                  }
                : {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    margin: 5,
                    backgroundColor: "#e3c0fc"
                  }
            }
          />
        </View>
      </View>
    );
  };

  onPressInstaSync = () => {
    this.fetchInstaFeed();
    // this.instagramLogin.show();
  };

  async fetchInstaFeed() {
    await this.setState({
      loading: true
    });
    let res = await fetch(
      "https://api.instagram.com/v1/users/self" +
        "/media/recent/?access_token=" +
        this.state.instaToken
    );
    let posts = await res.json();

    let users = [];
    posts.data.map((item, index) => {
      const imgInfo = item.caption.text;
      let userInfo = {
        id: index,
        uri: item.images.standard_resolution.url,
        name: imgInfo.substring(6, imgInfo.indexOf("city:")),
        city: imgInfo.substring(
          imgInfo.indexOf("city:") + 6,
          imgInfo.indexOf("price:")
        ),
        price: imgInfo.substring(imgInfo.indexOf("price:") + 7, imgInfo.length),
        link: item.link
      };
      users.push(userInfo);
    });
    await this.setState({ users: users, loading: false });
    await this.reorderUsers(this.state.users);
  }

  render() {
    const { loading, isMainScreen } = this.state;
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <LinearGradient
          style={{ flex: 1 }}
          colors={
            isMainScreen ? ["#f84040", "#f84040"] : ["#f84040", "#f84040"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={{ height: 60, position: "relative" }}>
            {/* {!isMainScreen && ( */}
            <View
              style={{
                width: SCREEN_WIDTH / 2 - 30,
                height: 30,
                position: "absolute",
                left: 20,
                top: 15
              }}
            >
              <Image
                source={titleImg}
                style={{
                  width: "100%",
                  height: "100%"
                }}
                resizeMode="stretch"
              />
            </View>
            {/* )} */}
            {isMainScreen && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  width: 40,
                  height: 40,
                  justifyContent: "center",
                  alignItems: "center"
                }}
                onPress={this.onPressInstaSync}
              >
                <Image source={instaIcon} style={{ width: 35, height: 35 }} />
              </TouchableOpacity>
            )}
            <Ins
              ref={ref => (this.instagramLogin = ref)}
              clientId="9b38baa73c194826975c44f2b6597f06"
              redirectUrl="https://google.com"
              scopes={["public_content+follower_list"]}
              onLoginSuccess={async token => {
                console.log("+++++++: ", token);
                await this.setState({
                  instaToken: token
                });
                // this.fetchInstaFeed();
              }}
              onLoginFailure={data => console.log("--++: fail = ", data)}
            />
          </View>
          {!isMainScreen ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                margin: 40,
                borderRadius: 30,
                backgroundColor: "#fdf1f2"
              }}
            >
              {this.renderTutor()}
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: "center" }}>
              {loading ? (
                <ActivityIndicator size="large" />
              ) : (
                this.renderUsers()
              )}
            </View>
          )}
          {isMainScreen && <View style={{ height: 60 }} />}
        </LinearGradient>
      </View>
    );
  }
}
