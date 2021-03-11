import React, { useState, useEffect, useContext,useRef, useCallback,Fragment,PureComponent } from 'react';
import { debounce } from "lodash";
import { StyleSheet, Text, View, Button,ScrollView,TouchableOpacity, Image,
  RefreshControl,TextInput,Alert,FlatList,KeyboardAvoidingView,ActivityIndicator,Keyboard,TouchableHighlight,Platform } from 'react-native';
import {colors, Header} from 'react-native-elements';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery,useLazyQuery , createHttpLink, useMutation} from "@apollo/client";
import Modal from 'react-native-modal'
//import {useMutation as classMutation} from '@apollo/react-components'
import { Appbar } from 'react-native-paper';
import { createNavigatorFactory, NavigationContainer, useNavigationBuilder } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator,HeaderBackButton } from '@react-navigation/stack';

import { Ionicons, FontAwesome, AntDesign,Feather  } from '@expo/vector-icons';
import { AuthContext, UserContext,IdContext } from '../components/context';
import AsyncStorage from '@react-native-community/async-storage';
//import Func from './MainContentSub/'
  
import HomeScreen from './HomeScreen'; 
import ScheduleScreen from './ScheduleScreen';
import {SEE_ALL_POSTERS,POST_VIEW,POST_UPLOAD,POST_DELETE,
  POST_LOAD,COMMENT_UPLOAD,COMMENT_DELETE,POST_INFO,COMMENT_NAME,POST_SEARCH}from '../queries'
   
import { valueFromAST } from 'graphql';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScreenStackHeaderLeftView } from 'react-native-screens';
import HyperlinkedText from 'react-native-hyperlinked-text'
//import { FlatList } from 'react-native-gesture-handler';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import { setStatusBarNetworkActivityIndicatorVisible } from 'expo-status-bar';
import { set } from 'react-native-reanimated';
import {
  AdMobBanner,
  AdMobInterstitial,
  PublisherBanner,
  AdMobRewarded,
  setTestDeviceIDAsync,
} from 'expo-ads-admob';

const adUnitID_ios = "ca-app-pub-8233357974153609/3291102463";
const adUnitID_android =  "ca-app-pub-8233357974153609/8459668669";


const AD_ID_BANNER = Platform.OS === 'ios'? "ca-app-pub-8233357974153609/3291102463" : "ca-app-pub-8233357974153609/8459668669"
var Bid//보드 아이디
var Uid// 유저 정보(id, grade)
var tnum = 40//게시글/댓글 불러오는 수
var type
var allComment
var allContent
const titleLen = 100;
const textLen = 4000;
const commentLen = 1000;
var Datalist
var snum
var Searchlist 
var searchSnum 
const NOW = new Date();
const TIMEZONE = NOW.getTimezoneOffset()*60;
var printsnum = 0;
export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, [])
  return update;
}

const wait = (timeout) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

const check = (id) =>{//삭제버튼 띄우는 조건
  ////console.log("check!!!!!!!!", id, Uid) 
  if(Uid == undefined) return false;
  if(Uid.id == id || ((type == 1|| type==2) && Uid.grade == 0 ) ) return true;
  else return false;
}

const UploadPostButton = ({navigation})=>{ //업로드버튼
  return (
  Platform.OS === 'ios' ? 
  <TouchableOpacity 
  style={{width:80,height:35,backgroundColor:'dodgerblue'}}
  onPress={()=>{ navigation.navigate("Upload")}}
    > 
  <Text style={{paddingTop:5,alignSelf:'center', fontSize:20, color:'white'}}>글쓰기</Text>
  </TouchableOpacity> 
  :
  <Button
    title="글쓰기"
    accessibilityLabel="글쓰기"
    onPress={()=>{navigation.navigate("Upload")}}
    /> 
);} 
    
var menuTouch = false;
const CustomMenu = (props) => { //메뉴 버튼
  ////console.log("메뉴",props.route);
  let _menu = null;
  const [isModalVisible, setModalVisible] = useState(false)
  return (
    <View style={props.menustyle}>
              <Modal isVisible={isModalVisible}>
        <TouchableOpacity style={styles.card} onPress={()=>{tnum =20 ; menuTouch = true;
          setModalVisible(false);props.navigation.navigate("Community",{needquery:true})}}
          > 
        <Text style={{alignSelf: 'center'}}>20</Text>
        </TouchableOpacity> 
        <TouchableOpacity style={styles.card} onPress={()=>{tnum =40 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true})}}>
        <Text style={{alignSelf: 'center'}} >40(기본값)</Text>  
        </TouchableOpacity> 
        <TouchableOpacity style={styles.card} onPress={()=>{tnum =60 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true})}}>
        <Text style={{alignSelf: 'center'}}>60</Text>
        </TouchableOpacity> 
        <TouchableOpacity style={styles.card} onPress={()=>{setModalVisible(false);}}>
        <Text style={{alignSelf: 'center'}}>취소</Text>
        </TouchableOpacity> 
        </Modal>
      <Menu
        ref={(ref) => (_menu = ref)}
        button={
          
            <TouchableOpacity onPress={() => _menu.show()}>
              <Ionicons name="menu" size={30}/>
            </TouchableOpacity>
        }> 
        <MenuItem onPress={() => {
         if (Platform.OS === 'ios'){  
          Alert.alert("글 설정","",
          [{ text: "20", onPress: () => { tnum =20 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true}) }},
          { text: "40(기본값)", onPress: () => { tnum =40 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true}) }},
          { text: "60", onPress: () => { tnum =60 ; setModalVisible(false);props.navigation.navigate("Community",{needquery:true}) }},
        ],{ cancelable: true });
         } 
         else setModalVisible(true);
        }}>글 설정</MenuItem>
         
      </Menu>
    </View>

  );
};
     
  
const areEqual_ = (prevProps, nextProps)=>{
  //console.log("areequal!!!!!!!!!",prevProps.post.index)
  return ( JSON.stringify(prevProps.post.item) === JSON.stringify(nextProps.post.item) );

}
       
const areEqual = (prevProps, nextProps) => {

  return ( JSON.stringify(prevProps.post.item) === JSON.stringify(nextProps.post.item) );
};
     
//var postTouch = false;



const Test = React.memo(({post,navigation,search = false})=>{
  if(post == null) return (null);
 // console.log("jhhuhuih",post.index);
  //console.log("mytoch",postTouch);
  const update = useForceUpdate();
  const time = new Date(Number(post.item.createdAt)+TIMEZONE);
  const H = time.getHours();
  const M = time.getMinutes();
  const goDebounce = useCallback(debounce(()=>{
    navigation.navigate("Post",{...post.item, num:post.index,fromhome: false,search:search, upload:false})
  },100));
  ////console.log(time.getDate());
  return(
    <View> 
    { 
    post.item.delete ? (null) : 
    <TouchableOpacity   
 

    style={styles.card}
    onPress= {()=>{ 
      //postTouch = true;
      //curPost = post.item.id
      goDebounce();}}
     > 
    <View style={{flexDirection: 'row',justifyContent:'space-between'}}>

    <View style={{flexDirection: 'row'}}>
    <Image style={{
      width : 30,
      height: 30,
      margin: 5,
    resizeMode: 'contain'
  }}
  source={require('../assets/igmyeong.png')} />
  {type == 1 ?
    <Text style={{fontSize: 15}}>익명</Text>:<Text style={{fontSize:15}}>{post.item.User.name}</Text> 
  }
    </View>
    <Text style={{fontSize: 10}}>{time.getFullYear()}/{time.getMonth()+1}/{time.getDate()}/{"  "}{H<10?`0${H}`:H}:{M<10?`0${M}`:M}</Text>
    </View>
    <Text style={{fontSize : 20}} numberOfLines={1}>{post.item.title}</Text>
    <Text style={{fontSize : 13}} numberOfLines={3}>{post.item.text}</Text>
    <View style={{alignItems:'flex-end'}}>
    <View style={{flexDirection:'row',marginTop:5}}>
      <FontAwesome name="comment-o" size={10} color='blue' />
      <Text style={{fontSize:10,marginLeft:10}}>{post.item.Comment.length}</Text>
      </View>
    </View>
</TouchableOpacity>
}
</View>

  ); 

},areEqual_);
 

    
var refreshing = false
var init = true;
function GetAllPost({needquery,navigation}){
  const update = true;
 // console.log("GetAllPost진입@@@@@@@@@@@@@@",init)
  ////console.log("@@@@",Datalist)
  //var scroll = 0; 
  //if(!route.params.needquery) scroll = Datalist.scroll;
  //const scrollViewRef= React.useRef()
  ////console.log("@@@@@@@@@@@",Datalist.Array);
  //console.log(Datalist)
  const [ 
    fetch, 
    { loading, data }
  ] = useLazyQuery(POST_LOAD,{
    variables: {bid: Bid, snum: snum, tnum: tnum}
});

  if(data!=undefined){
    //console.log("@@@@@fetchnew!!!!!!")
    for(var i=0; i<data.loadPost.length; i++)
      Datalist.Array.push(data.loadPost[i]);
    snum+=tnum ;

    ////console.log(Datalist.Array.length)
  }

  const onRefresh = () => {
    refreshing = true;
    wait(10).then(() =>{ refreshing = false;
        navigation.navigate("Community",{needquery: true})});
  }
    
  return(  
    
    <View style={{flex:1}}> 

      <FlatList
      keyExtractor={(post) => post.id.toString()}
      data = {Datalist.Array} 
      renderItem ={(post)=>{
        ////console.log("어슈발뭐지??",post);
          return( <Test post={post} navigation={navigation} />);
      }
        }  
      windowSize = {2}
         
          onEndReached={()=>{////console.log("끝!!"); 
            //console.log(" 왜안되냐고")
            if(data == undefined) fetch()
            else{
              if(data.loadPost.length != 0 ) fetch();
            }
            }}      
      onEndReachedThreshold={0.1}

      ListFooterComponent={
        Datalist.Array.length != 1 ?
                data == undefined?
                <ActivityIndicator style={{paddingTop:'10%'}} color="#1478FF"/>
              :
              data.loadPost.length == 0? 
                (null) :<ActivityIndicator style={{paddingTop:'10%'}} color="#1478FF"/> 
        : data == undefined ?
          <ActivityIndicator style={{paddingTop:'10%'}} color="#1478FF"/>
          :
          data.loadPost.length == 0?
          <View style={{marginTop:'50%',alignItems:'center'}}>
          <Feather name="alert-circle" size={50} color="gray" />
          <Text style={{fontSize:20,color:'gray'}} >
            아직 등록된 글이 없습니다.
          </Text>
          </View>:(null)
           
    }
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh ={onRefresh}/>}
      />
    
      <View style={{borderWidth:1,position:'absolute',bottom:Platform.OS === 'ios'?'4%': 10,alignSelf:'center'}}>
      {type == 0 ?
      Uid.grade == 0 ? <UploadPostButton navigation={navigation}/> : (null)
      : 
      <UploadPostButton navigation={navigation}/>
    }
      </View>
    </View>
  );
  
}


/*
const IinitialPost =({navigation})=>{
  ////console.log("@@@@@@@@@inital")
  const {loading, error, data} = useQuery(POST_LOAD,{
    variables: {bid: Bid, snum: 0, tnum: tnum}
  });
  if(loading)return <ActivityIndicator color="#1478FF"/>
  if(error)return <Text>에러!!</Text>

  for(var i=0; i<data.loadPost.length; i++)
  Datalist.Array.push(data.loadPost[i])
  snum += tnum;
   
  return (
    <GetAllPost navigation={navigation}/>
  );

}*/

 
export function Community({route, navigation}){
 //console.log("Commnufdisufdfs",route);
 //if(route.params.fromhome) 
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: { 
       Authorization: `Bearer ${userInfo.token}`
      },
  })
  init = false;
  const Id =useContext(IdContext)
  Uid = Id
  Bid = route.params.id
  allComment = null;
  allContent = null;
  type = route.params.type
  if(route.params.needquery){ 
    init = true;
    snum = 0;
    Datalist = {Array:[{id:-1,delete:true}], scroll:0};
  }
  
  React.useLayoutEffect(() => {

    navigation.setOptions({
 
      headerRight: () => { //새로고침 버튼

        return (
          <View style ={{flexDirection:'row'}}>
            <TouchableOpacity  style={{alignSelf:'center',marginHorizontal:10}}
            onPress= {()=>{  printsnum = 0;
              navigation.navigate("Community",{id:route.params.id, name:route.params.name,needquery: true})}}
            >
              <FontAwesome name="refresh" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={{alignSelf:'center',marginLeft:10}}
            onPress = {()=>{navigation.navigate("Search",{needreload:false})}}
            >
              <FontAwesome name="search" size={24} color="black" />
            </TouchableOpacity>
            
            <CustomMenu
              menutext="Menu"
              menustyle={{marginHorizontal: 14}}
              textStyle={{color: 'white'}}
              navigation={navigation}
              route={{id:route.params.id, name:route.params.name}}
              navigation={navigation}
            />
            </View>
          )  
        },  
      headerTitle: ()=>(<Text style ={{fontSize:20}}>{route.params.name}</Text>) //커뮤니티 타이틀바꾸기
      
   }); 
     }, [navigation,route]);


     //잠깐 수정 0131
  return(
  <ApolloProvider client = {client}>
    {Uid.grade == 2 || Uid.grade == 3 ?
       <AdMobBanner
   style={styles.adcard}
   adUnitID={AD_ID_BANNER} // Test ID, Replace with your-admob-unit-id
   servePersonalizedAds // true or false
  onDidFailToReceiveAdWithError={this.bannerError} 
    /> : (null)}
 <GetAllPost needquery={route.params.needquery} navigation={navigation}/>
  </ApolloProvider>
   );
  
}  
 
export function Post({route,navigation}){
  //postTouch = false;
  //console.log("------------Post------",route);
    const userInfo = React.useContext(UserContext);
    if(route.params.fromhome) type = 0;
    const client = new ApolloClient({
      uri: "http://52.251.50.212:4000/",
      cache: new InMemoryCache(),
      headers: { 
         Authorization: `Bearer ${userInfo.token}`
        },
    })
    printsnum = 0;
    React.useLayoutEffect(() => {
      navigation.setOptions({ 
   
        headerTitle: ()=>{} //커뮤니티 타이틀바꾸기
        
     }); 
       }, [navigation,route]);
    return(
      <ApolloProvider client = {client}>
        <ViewPost route ={{...route}} navigation={navigation} />
    </ApolloProvider>    

      
  );
   
  }
     


  const SetHeader = ({route,navigation})=>{ //새로고침,삭제 헤더버튼 추가.
    //console.log("hedear----------------------");
  

    const [deletePostMutation] = useMutation(POST_DELETE);
    const deletePost = React.useCallback(async(pid) =>{
        try{
        const data = await deletePostMutation({
          variables: {
            pid: pid
          }
        }
      )} 
      catch(e){
        console.log(e); 
        }
    } );

         
    React.useLayoutEffect(() => {
      //console.log("header layouteffect-------------------")
    // console.log("헤더들감")
      navigation.setOptions({ 
  
        headerRight: () => {
       
          return (
          <View style={{flexDirection:'row'}} >
      <TouchableOpacity  style={{alignSelf:'center',marginHorizontal:10}}
      onPress= {()=>{  printsnum = 0;
        navigation.navigate("Post", {upload:true})}}
       >
         <FontAwesome name="refresh" size={24} color="black" />
       </TouchableOpacity>
              <View style={{marginHorizontal:10}}>
            {check(route.userId) ? 
            (<Button title="삭제" onPress={()=>{
              printsnum = 0;
              Alert.alert( 
              "글을 삭제하시겠습니까?",
              "",
              [
                { 
                  text: "예",
                  onPress: () => {
                    printsnum = 0;
                    deletePost(route.id);
  
                    if(route.fromhome) navigation.goBack();
                    else{
                      
                      if(route.search){
                        Searchlist[route.num] ={id:route.id, delete:true} 
                        navigation.navigate("Search",{needreload:true})
                    }
                      else {
                        
                        Datalist.Array[route.num] = {id:route.id, delete: true}; 
                      navigation.navigate("Community",{id:Bid,needquery:false})}}
                  
                  },
                  style: "cancel"
                },
                { text: "아니오", onPress: () => {return;} }
              ],
              { cancelable: true }
            );} }/>)
  
            :
  
            (null)
            }
            </View>
            </View>)}, 
    
         headerLeft :()=>{////console.log("정신나갈거같에정시난갈거같에정신",route.upload)
    
         if(route.fromhome) return (<HeaderBackButton onPress={()=>{printsnum = 0;navigation.goBack()}}/>);
         return (route.upload == true) ?
              (<HeaderBackButton onPress={()=>{printsnum = 0;
                if(route.search){
                  //console.log("여기가되야하는데..")
                  navigation.navigate("Search",{needreload:true})}
                else navigation.navigate("Community",{needquery: false})}}/>) 
                      :(<HeaderBackButton onPress={()=>{
                        //console.log("해더버튼printsnunm초기화전")
                        printsnum = 0;
                        //console.log("초기화 후")
                        navigation.goBack()
                        }} />)
                    }
          
     } );   
       }, [navigation,route.upload]); 
  
 
       
       return  (null);
  
  }
       


function ViewPost({route,navigation}){//한 Post 다 출력
  //console.log("----------viewpoint rotue-------------")
  const cond = (route.params.upload == true) 
  //console.log(cond);
    

if(!cond ){
allContent = {id:route.params.id, UserId: route.params.UserId, 
              createdAt: route.params.createdAt, text:route.params.text,
              title:route.params.title, num:route.params.num,
              commentLen:route.params.Comment.length,
              User: route.params.User ,
              __typename:"Post"};
allComment = route.params.Comment;
}



  return(
   
      <Fragment>
      <SetHeader route={{id: route.params.id , upload: route.params.upload, 
        userId: route.params.UserId, num:route.params.num, 
        fromhome: route.params.fromhome, search:route.params.search}}
       navigation={navigation} />
      {cond?
      <CommentReload route ={{id: route.params.id, userId: route.params.UserId, 
        text:route.params.text, title:route.params.title,
        createdAt : route.params.createdAt, num: route.params.num, fromhome: route.params.fromhome,
        user : route.params.User, search:route.params.search
      }}
        navigation ={navigation}/>
      :
        type == 1?
        <PrintAllContent  navigation={navigation} search={route}/>
        : 
        <CommentReload route ={{id: route.params.id, userId: route.params.UserId, 
          text:route.params.text, title:route.params.title,
          createdAt : route.params.createdAt, num: route.params.num, fromhome: route.params.fromhome,
          user : route.params.User, search:route.params.search
        }}
         navigation ={navigation}/>
        } 
  {Platform.OS === 'ios'?
 <KeyboardAvoidingView style={{flexDirection:'row',justifyContent:'flex-end',marginBottom:'7%', marginHorizontal:'3%',marginTop:'3%'}}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={offset}
    >
      <CommentInput  route={{id: route.params.id}} navigation ={navigation}/>
      </KeyboardAvoidingView>
  :
  <View style={{justifyContent:'flex-end',margin:10}}>
  <CommentInput  route={{id: route.params.id}} navigation ={navigation}/>
</View>
}
  </Fragment>);
}      
         


//<CommentInput  route={{id: route.params.id}} upload = {uploadComment} navigation ={navigation}/>
const PrintAllContent = ({navigation}) =>{
 
  if(allComment == undefined || allContent == undefined) return (null);
  ////console.log("print!!!!!!!!!!!", allComment.length, printsnum);
  ////console.log("beforeallcontent!!!!!!!",allContent.length,"printsum",printsnum)
  ////console.log("print!!!!!!!!!!!", allContent.length);
  

  return( 
    <Fragment>
    <FlatList
    data = {allComment}
    keyExtractor={(post)=>post.createdAt.toString()} 
    renderItem={(post) =>
     <CommentContent post={post} navigation={navigation}/>
    } 
    windowSize={2}
    ListHeaderComponent={()=><PostStyle post={{...allContent}}/>}
    onEndReached={()=>{//console.log("끝!!");
    }}
    extraData={false}
   onEndReachedThreshold={0.1}
   bounces={false}
    /> 
    </Fragment>
  );

}
  
const Loading = ({navigation}) =>{
  //console.log("loading----------------")
     return <ActivityIndicator  style={{paddingTop:'10%'}} color="#1478FF"/>
}
  


const CommentReload = ({route,deleteComment, navigation}) =>{
  //console.log("Reloo!!!--------------")
  //여기서 버튼 hide하면 될듯.
  const{loading, error, data} = useQuery(POST_VIEW,{ //댓글 불러오는 쿼리
    variables: {pid: route.id}
  })   
  if(loading){     
 return (<Loading  navigation={navigation}/>);
} 
  if(error) return(<Text>에러!!{error}</Text>);
  //console.log(data);
  if(data!=undefined){ //새로고침중 뒤로가기 버튼 눌렀을때 생각.
  allComment = data.seeAllComment 
  allContent = {id:route.id, UserId: route.userId, 
    createdAt: route.createdAt, text:route.text,
    title:route.title, num:route.num,
    commentLen:data.seeAllComment.length,
    User: route.user,
    __typename:"Post"}; 
  ////console.log("바뀐Comment정보!!!!!!!!", data)
  if(data.seeAllComment.length != 0 && route.fromhome != true){
  const temp = {UserId : route.userId, __typename:"Post", 
          createdAt: route.createdAt, id:route.id,
          text: route.text, title: route.title,
          Comment: data.seeAllComment,
          User: route.user
        };
  if(route.search) Searchlist[route.num] = temp;
  else Datalist.Array[route.num] = temp;
  }

  }
   
  /*for(var i =0; i<Datalist.Array.length ; i++){
  //console.log("Datalist.array!!!!",Datalist.Array[i].id)
  }*/ 
  return(
   data.seeAllComment.length != 0?

      <PrintAllContent  navigation={navigation}/>
    :
    <SearchPost route ={route} navigation={navigation}  /> 
    
    
     
  ); 
} 
    
const SearchPost = ({route,navigation,deleteComment}) =>{
  //console.log("@@@@@@@@@searchpost진입")
  const{loading, error, data} = useQuery(POST_INFO,{ //댓글 불러오는 쿼리
    variables: {pid: route.id}
  })
  if(loading) return (<ActivityIndicator style={{paddingTop:'10%'}} color="#1478FF"/>);
  if(error) return(<Text>에러!!{error}</Text>);
 // //console.log(data);
  if(data.seePost == null){
    if(!route.fromhome){ 
      if(route.search) Searchlist[route.num] = {id:route.id, delete: true}
      else Datalist.Array[route.num] = {id:route.id, delete: true};
    }
    Alert.alert("삭제된 게시물입니다.","",
    [{ text: "예", onPress: () => {navigation.navigate("Community",{needquery:false})}}],
      { cancelable: false })
   
    return( null );
  }      
  else {   
    if(!route.fromhome){
    const temp = {UserId : route.userId, __typename:"Post", 
    createdAt: route.createdAt, id:route.id,
    text: route.text, title: route.title,
    Comment: [],
    User : route.user
  };
  if(route.search) Searchlist[route.num] = temp;
   else Datalist.Array[route.num] = temp;
    }
  } 
 
  return(
    <PrintAllContent  navigation={navigation}/>
     );
  
} 
 


const offset = Platform.OS == 'ios' ? 100 : 0
const CommentInput=({route,navigation})=>
{ 
 
  const textref = React.useRef();
  const [text,setText] = useState("");
  //const [prevent, setPrevent] = useState(route.prevent);
  //console.log("prevent",prevent)
  //console.log(prevent);
 //console.log("Commentinput!!!");

 const [uploadMutation] = useMutation(COMMENT_UPLOAD);//
 const uploadComment = React.useCallback(async(pid,text) =>{
     try{
     const data = await uploadMutation({
       variables: {
         pid: pid,
         text: text
       }
     } 
   );
 }
   catch(e){
     console.log(e); 
     }
 } );
 
 
  return (
  
    Platform.OS === 'ios'?
    <Fragment >
    <TextInput
    ref = {textref}
    style={{flex:1, backgroundColor : 'gainsboro'}}
       placeholder="댓글을 입력하세요."
       onChangeText={(val)=>setText(val)}
       multiline
       maxLength={commentLen}
       value = {text}
       maxHeight={60}
        /> 
      
    <TouchableOpacity style={{flex:0.1, width:35, height:35,backgroundColor : 'gainsboro'}} onPress={() => {
      Keyboard.dismiss();
      var temp = text.trim()
      temp=temp.replace(/(\s|\r\n)+/g," ")
      if(temp.length == 0)Alert.alert("댓글을 입력하세요.");
      else{
          printsnum = 0;
      uploadComment(route.id, text);
      textref.current.clear();
      //console.log(text)
      setText(""); 
      navigation.navigate("Post",{upload:true})}
    }}>
      <FontAwesome style={{alignSelf:'center',color:'dodgerblue',paddingTop:5}}name="paper-plane" size={24} color ="black" />
    </TouchableOpacity>
  </Fragment>
    :
    <View style={{flexDirection:'row'}}>
  <TextInput
  ref = {textref}
  style={{flex:1, backgroundColor : 'gainsboro'}}
     placeholder="댓글을 입력하세요."
     onChangeText={(val)=>setText(val)}
     multiline
     maxLength={commentLen}
     value = {text}
     maxHeight={60}
      /> 

  <Button       
  style={{flex:1}}
  title="입력" onPress={()=>{ 
    ////console.log("------------------------",route)
    Keyboard.dismiss();
    var temp = text.trim()
    temp=temp.replace(/(\s|\r\n)+/g," ")
    if(temp.length == 0)Alert.alert("댓글을 입력하세요.");
    else{
        printsnum = 0;
  uploadComment(route.id, text);
  textref.current.clear();
  //console.log(text)
  setText(""); 
  navigation.navigate("Post",{upload:true})}
    
  }} />

     </View> 
  
     ); 

}

const CommentContent = React.memo(({post, navigation}) =>{
  //console.log("commentcontent", post.index);
 
  const [deleteCommentMutatin] = useMutation(COMMENT_DELETE);
  const deleteComment = React.useCallback(async(cid) =>{
    try{
    const data = await deleteCommentMutatin({
      variables: {
        cid: cid
      }
    } 
  );
} 
  catch(e){
    console.log(e); 
    }
} );

  const time = new Date(Number(post.item.createdAt)+TIMEZONE);
  const H = time.getHours();
  const M = time.getMinutes();
  return(
    <View style={styles.card2}>
     <View style={{flexDirection: 'row',justifyContent:'space-between'}}>
      
     <View style={{flexDirection: 'row'}}>
        <Image style={{
        width : 20,
        height: 20,
        margin: 5,
      resizeMode: 'contain'
      }}
      source={require('../assets/igmyeong.png')} />
    {type == 1 ?
    <Text style={{fontSize: 15}}>익명</Text> : <Text style={{fontSize: 15}}>{post.item.User.name}</Text>
    }
      </View>
      { (check(post.item.UserId))?
    <Button title="삭제" onPress={()=>
    {           
      
      Alert.alert(
      "댓글을 삭제하시겠습니까?",
      "", 
      [
        {
          text: "예", 
          onPress: () => {
            printsnum = 0;
            deleteComment(post.item.id);
            navigation.navigate("Post",{upload: true});
          },
          style: "cancel"
        },
        { text: "아니오", onPress: () => {return;} }
      ],
      { cancelable: true }
    );
    }}/> : (null)
    }
     </View>
    <HyperlinkedText style={{fontSize:15}}>{post.item.text}</HyperlinkedText>
    <Text style={{fontSize:10}}>{time.getFullYear()}/{time.getMonth()+1}/{time.getDate()}/{"  "}{H<10?`0${H}`:H}:{M<10?`0${M}`:M}</Text>
    </View>
  ); 
},areEqual_);
            
const PostStyle = React.memo(({post}) => {
  //.log("poststyle!!!");
  const time = new Date(Number(post.createdAt)+TIMEZONE);
  const H = time.getHours()
  const M = time.getMinutes()
  return(
    <View style={styles.card}>
    <View style={{flexDirection: 'row',justifyContent:'space-between'}}>

        <View style={{flexDirection: 'row'}}>
        <Image style={{
        width : 30,
        height: 30,
        margin: 5,
      resizeMode: 'contain'
      }} 
      source={require('../assets/igmyeong.png')} />
        {type == 1 ?
    <Text style={{fontSize: 15}}>익명</Text>:<Text style={{fontSize:15}}>{post.User.name}</Text> 
  }
      </View>
      <Text style={{fontSize: 10}}>{time.getFullYear()}/{time.getMonth()+1}/{time.getDate()}/{"  "}{H<10?`0${H}`:H}:{M<10?`0${M}`:M}</Text>
    </View>
      <Text style={{fontSize : 25}}>{post.title}{"\n"}</Text>
      <HyperlinkedText style={{fontSize : 20}} >{post.text}</HyperlinkedText>
 
      <View style={{flexDirection:'row',marginTop:5}}>
      <FontAwesome name="comment-o" size={10} color='blue' />
      <Text style={{fontSize:10,marginLeft:10}}>{post.commentLen}</Text>
      </View>
    </View>
  );
} ,areEqual_);
 

const CheckUpload = ({navigation}) => {
  ////console.log("eeeeee",bid,typeof(bid));
  const [uploadmutation] = useMutation(POST_UPLOAD);
  const upload = React.useCallback(async(bid, title, text) =>{
    try{
    const data = await uploadmutation({
      variables: {
        bid: bid,
        title: title,
        text: text
      }
    }
  )}
  catch(e){
    console.log(e); 
  }
  });
  return(<UpdateScreen navigation={navigation} upload={upload} />);
}

export function Upload({route,navigation}) {  
  //console.log("Upload")
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: {
       Authorization: `Bearer ${userInfo.token}`
      },
  })

  return(<ApolloProvider client={client}>
    <CheckUpload navigation ={navigation} />
    </ApolloProvider>
  );
}
 
const UpdateScreen = ({navigation, upload})=>{
  const [title,setTitle] = useState("");
  const [text, setText] = useState("");


  return(<KeyboardAwareScrollView>
 
      <View style={{flex:1 ,marginTop:Platform.OS ==='ios'?'15%': 40
      , marginHorizontal:10 ,flexDirection:'row',justifyContent:'space-between'}}>
    <View style = {{flexDirection: 'row'}}>
    <TouchableOpacity  style={{alignSelf:'center'}}
    onPress= {()=>{ 
       navigation.goBack()}}
     >
       <AntDesign name="closecircle" size={30} color="dodgerblue" />
     </TouchableOpacity>
  <Text style={{fontSize:25, marginLeft:10}}>글쓰기</Text>
  </View> 
  <Button title="완료"  
  onPress={() =>{
    var tempTitle = title.trim()
    var tempText = text.trim()
    if(tempTitle.length == 0 || tempText.length == 0) Alert.alert("제목, 글 모두 입력하세요.","",[],{cancelable:true})
    else{
      Alert.alert(
        "글을 입력하시겠습니까?",
        "", 
        [
          {
            text: "예",
            onPress: () => {
              upload(Bid,tempTitle,tempText);
              navigation.navigate("Community",{id: Bid,needquery:true})
            },
            style: "cancel"
          },
          { text: "아니오", onPress: () => {return;} }
        ],
        { cancelable: true }
      );
    }   
  }} /> 
  </View > 
  <View style={{margin:10}}>
  <TextInput 
        style={{
          textAlignVertical: "top",
          fontSize : 20
        }}
    placeholder="제목"
    autoCapitalize="none"
    onChangeText={(val)=>setTitle(val)}
    value={title}
    maxLength={titleLen}
     />
   </View>  
   <View style={{marginHorizontal:10, marginTop:10}}>
  <TextInput 
        style={{
          textAlignVertical: "top",
          fontSize : 20
        }}
    placeholder="내용"
    autoCapitalize="none"
    onChangeText={(val)=>setText(val)}
    multiline={true}
    scrollEnabled={false}
    maxLength={textLen}
    value={text}
     />
  </View>
</KeyboardAwareScrollView>
  );
}

export function Search ({route,navigation}){

  if(!route.params.needreload){
    Searchlist = [{id:-1,delete:true}];
    searchSnum = 0;
  }
  //console.log("search진입")
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: {
       Authorization: `Bearer ${userInfo.token}`
      },
  })
  return(
  <ApolloProvider client={client}>

  <InitSearch initstate={route.params.needreload} navigation={navigation}/>
  </ApolloProvider>
);

}


var getData = false;
export function InitSearch ({init,initstate,navigation}){
  //console.log("InitSearch")
  const [text, setText] = useState("")
  const [state, setState] = useState(initstate);
 
  ////console.log("setstate!!!!!!",state)
  return (<View style={{flex:1,marginTop:'14%',marginHorizontal:5}}>
    <View style={{justifyContent:'flex-start'}}>
    <SearchInput needreload={initstate} init="" setState={setState} setParentText={setText} navigation={navigation}/>
    </View>
    <View style={{marginTop:15}}>
    {state ? 
       
      <GetAllSearch text={text} navigation={navigation} />
    :<View style={{marginTop:'50%',alignItems:'center'}}>
      <AntDesign name="search1" size={50} color="gray" />
      <Text style={{fontSize:20,color:'gray'}} >
        게시판의 글을 검색해보세요.
      </Text>

      </View>}
    </View>
  </View>)

}


const SearchInput = ({needreload,init,setState,setParentText,navigation})=>{
  
  const [text, setText] = useState(init)
  
  return( <View style={{flexDirection:'row'}}>
    <TouchableOpacity style={{flex:0.1, alignItems:'center'}}
    onPress={()=>{
      searchSnum=0; Searchlist=[{id:-1,delete:true}];

      if(needreload) navigation.navigate("Community",{needquery:true})
      else navigation.goBack()}
      }>
    <Ionicons name="arrow-back" size={24} color="black" />

      </TouchableOpacity>
  <TextInput
  style={{flex:1, backgroundColor : 'gainsboro',fontSize:24}}
     placeholder="글, 제목"
     onChangeText={(val)=>setText(val)
    
    }
    maxLength={1000}
      /> 
  <TouchableOpacity 
  style={{flex:0.1,alignItems:'center'}}
   onPress={()=>{
    ////console.log("------------------------",route)
    var temp = text.trim()
    if(temp.length <2){
      Alert.alert("두 글자 이상 입력해주세요","")
    }
    else{
   // getData = true;
    setState(true); 
    setParentText(text);
    Searchlist = [{id:-1, delete:true}];
    searchSnum = 0;
    }
  }} >
    <FontAwesome name="search" size={24} color="black" />
  </TouchableOpacity>
     </View> );
}

const InitPrintSearch = ({text,navigation}) =>{
  //console.log("InitPrintSearch@@@@@@@@@@@@@")
  getData = false;
  const {loading, error, data} = useQuery(POST_SEARCH,{
    variables: {bid: Bid, snum: 0, tnum: tnum, text:text}
  }); 
  if(loading)return <ActivityIndicator  style={{paddingTop:'10%'}} color="#1478FF"/>
  if(error)return <Text>에러!!</Text>

 
  ////console.log(data.searchPost)
  for(var i=0; i<data.searchPost.length; i++)
    Searchlist.push(data.searchPost[i])
  snum += Searchlist.length;
  //console.log("now searchlist",Searchlist)
  searchSnum += Searchlist.length;
   
  return (
    <GetAllSearch text={text} navigation={navigation}/>
  );

}  

const GetAllSearch = ({text,navigation}) =>{
 // console.log("getAllsearch!!!@@@@@@",Searchlist)
  const [ 
    fetch, 
    { loading, data }
  ] = useLazyQuery(POST_SEARCH,{
    variables: {bid: Bid, snum: searchSnum, tnum: tnum,text: text}

});

if(data!=undefined){
  //console.log("@@@@@fetchnew!!!!!!")
  for(var i=0; i<data.searchPost.length; i++)
    Searchlist.push(data.searchPost[i]);
  searchSnum += data.searchPost.length;

}
   
return(  
    <FlatList
    keyExtractor={(post) => post.id.toString()}
    data = {Searchlist} 
    renderItem ={(post)=>{ 
      ////console.log("어슈발뭐지??",post);
        return (
          post == null? (null) : <Test post={post} navigation={navigation} search={true}/>
      );
        }}  
    windowSize = {2}
        onEndReached={()=>{//console.log("끝!!"); 
         // //console.log(data)
         
          if(data == undefined) fetch()
          else{
            if(data.searchPost.length != 0 ){ 
              //console.log("외왆돼")
              fetch(); }
          }
          }}  
 
    onEndReachedThreshold={0.1}
    ListFooterComponent={()=>{
      //console.log(data)
      return(
      Searchlist.length != 1 ?
              data == undefined?
              <ActivityIndicator style={{paddingTop:'10%'}} color="#1478FF"/>
            :
            data.searchPost.length == 0? 
              (null) :<ActivityIndicator style={{paddingTop:'10%'}} color="#1478FF"/> 
      :data == undefined ?
        <ActivityIndicator style={{paddingTop:'10%'}} color="#1478FF"/>
        :
        data.searchPost.length == 0?
        <View style={{marginTop:'50%',alignItems:'center'}}>
        <Feather name="alert-circle" size={50} color="gray" />
        <Text style={{fontSize:20,color:'gray'}} >
          해당하는 글이 없습니다.
        </Text>
        </View>:(null)
      );
    }
  }

  bounces ={false}
    />
);


}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 10,
    margin: 1,
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 5,
    textAlign: "center",
    justifyContent: "center",
  },
  card2: {
    backgroundColor: "white",
    padding: 10,
    borderWidth: 1, 
    borderColor: "#dcdcdc",
    borderRadius: 5,
    textAlign: "center",
    justifyContent: "center",
  },
  adcard:{
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
    width: "90%",
    color: '#05375a',
},
});



