import React, { useState, useEffect, useContext,useRef, useCallback,Fragment, useReducer } from 'react';
import { AppRegistry } from 'react-native';
import { StyleSheet, Text, View, Button,ScrollView,TouchableOpacity, Image,
  RefreshControl,TextInput,Alert,FlatList,KeyboardAvoidingView,Dimensions,Platform } from 'react-native';
import {colors, Header} from 'react-native-elements';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery,useLazyQuery , createHttpLink, useMutation} from "@apollo/client";
import Modal from 'react-native-modal'

import { GET_CONTINENTS, GET_CONTINENT, SEE_REGIST_LECTURE, GET_USERID } from "../queries";
import { Appbar } from 'react-native-paper';
import { createNavigatorFactory, NavigationContainer, useNavigationBuilder } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator,HeaderBackButton } from '@react-navigation/stack';

import { Ionicons, FontAwesome, AntDesign,Entypo,Feather,MaterialCommunityIcons  } from '@expo/vector-icons';
import { AuthContext, UserContext,IdContext, MemoContext } from '../components/context';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import HomeScreen from './HomeScreen'; 
import ScheduleScreen from './ScheduleScreen';
import {SEE_ALL_POSTERS,POST_VIEW,POST_UPLOAD,POST_DELETE,POST_LOAD,COMMENT_UPLOAD,COMMENT_DELETE,POST_INFO}from '../queries'
import { valueFromAST } from 'graphql';
import { KeyboardAwareScrollView, KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';

import { ScreenStackHeaderLeftView } from 'react-native-screens';
import HyperlinkedText from 'react-native-hyperlinked-text'
//import { FlatList } from 'react-native-gesture-handler';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import { setStatusBarNetworkActivityIndicatorVisible } from 'expo-status-bar';
import { set } from 'react-native-reanimated';

import { useIsFocused } from '@react-navigation/native'

var KeepData = null;

 
  
//var templist = []
const titleLen = 100;
const textLen = 1000;
const checkLen = 500;
const realMemoLen = 0;
const areEqual = (prevProps, nextProps) => {
  //console.log("areequal!!!!!!!!!!!!!!!!1",nextProps.memo.index)
  return (JSON.stringify(prevProps.memo.item) === JSON.stringify(nextProps.memo.item)
  &&
  prevProps.memo.index === nextProps.memo.index
  );
 
}   
 

function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, [])
  return update;
}

const MemoPrint = React.memo(({memo,navigation}) =>{
  //console.log("memoprint실행",memo.item.id)
 // var short;
  

   
return( 

<TouchableOpacity  
  style={styles.card}
  onPress= {()=>{
    checklist=memo.item.checklist.slice(); 

    //templist = memo.item.checklist.slice();//

    //console.log("????",checklist);   
    navigation.navigate("keepUpload",{mode:memo.index,
    initText:memo.item.text, initTitle:memo.item.title, initButton : false
    
  })
  }}
   >
 
    <Text numberOfLines={2} style={{fontSize:23}}>{memo.item.title}</Text>
    <Text numberOfLines={3} style={{fontSize:17}}>{memo.item.text}</Text>
        {memo.item.checklist.length > 6?
        <View >
          {memo.item.checklist.slice(0,6).map((check)=><CheckPrint memo={check} key={check.id}/>)}
          <Text>...</Text>
        </View>
        :
        <View>
        {memo.item.checklist.map((check)=><CheckPrint memo={check} key={check.id}/>)}
        </View>
        }
    </TouchableOpacity> 

);
},areEqual);
  


const CheckPrint = React.memo(({memo})=>{
  //console.log("checkPrint!!!!!!!!!1",memo)
  return ( 
 
    
    <View style={{flexDirection:'row', marginTop:10,justifyContent:'space-between'}}> 
 

        {memo.toggle ? 
        <Fragment >
        <Feather style={{width:'7%'}}  name="check-circle" size={17} color="gray" />
        <Text style={{textDecorationLine:'line-through',width:'93%',fontSize:17,color:'gray'}}  numberOfLines={2} >{memo.text}</Text> 
        </Fragment>
        : 
        <Fragment>
        <Entypo style={{width:'7%'}} name="circle" size={17} color="black" />
        <Text style={{width:'93%',fontSize:17, color:'black'}} numberOfLines={2}>{memo.text}</Text>
        </Fragment>
        }
  
        
    </View>

  ) 

})
  
export const KeepScreen = ({route,navigation})=>{
  const update = useForceUpdate();
  //console.log("keepscreen!!!!!!",refresh)
 /* console.log("Keepscreen", route)
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: { 
       Authorization: `Bearer ${userInfo.token}`
      },
  })*/

  //const isFocused = useIsFocused();

  useEffect(()=>{
    const unsubscribe = navigation.addListener('focus', () => {
      update();
    });
    return unsubscribe;
  },[navigation])


  return(
  <KeepContent navigation={navigation} reload={update}/> 
   );

} 
   
var refresh = false;
export const KeepContent = ({reload,navigation}) => {
  const update = useForceUpdate();
 // console.log("KeepContent!!1:")
  //console.log(KeepData)
  
  const writeData = useCallback (async () =>{ //데이터 쓰기
      //console.log("write data!!!!!!!!!!")

    try {
      await AsyncStorage.setItem('MEMO', JSON.stringify(KeepData));
    } catch (e) {
      console.log(e)
    }
  });

 
  const readData = useCallback(async () => {
    try { 
      const userMemo = await AsyncStorage.getItem("MEMO")
  
      if (userMemo !== null) {
       //console.log("저장소에 먼가 있음")
        KeepData = JSON.parse(userMemo)
        //realMemoLen = KeepData.length;
        update();
      }
      else{
        //console.log("저장소에 먼가 없음")
        KeepData = [];
      }
    } catch (e) {
      console.log(e)
      alert('Failed to fetch the data from storage') 
    }
  });

 
  useEffect(()=>{
   // console.log("useffect실행!!")
    if(KeepData == null){
      //console.log("야되냐?")
      readData();
    
    } 
    else{
      if(refresh){
        refresh = false;
        writeData();
      }
      update(); 
    }
  },[refresh]);
   
   

  //console.log("HERE WE GO",storeMemo);
  return ( 
    <View style={{flex:1}} >
      { KeepData == null?
      (null)
      :  
      <FlatList 
        data = {KeepData}
        keyExtractor={(memo)=>memo.id.toString()}
        renderItem = {(memo) => {

          return <MemoPrint memo={memo} navigation={navigation}/>
        }}
        windowSize={2}
        onEndReached={()=>{//console.log("끝!!");
        
        }}
        bounces={false}
       onEndReachedThreshold={0.1}
      />     
      } 
      <View style={{borderWidth:1,position:'absolute',bottom:Platform.OS === 'ios'?'3%':10,alignSelf:'center'}}>
      {Platform.OS === 'ios' ?
       <TouchableOpacity 
       style={{width:150,height:35,backgroundColor:'dodgerblue'}}
       onPress={()=>{ 
         checklist=[]
         //templist =[]
         navigation.navigate("keepUpload",{mode:"write", initText:"", initTitle:"",initButton : false})}}
         > 
       <Text style={{paddingTop:5,alignSelf:'center', fontSize:20, color:'white'}}>체크리스트 추가</Text>
       </TouchableOpacity> 
      :
        <Button title="체크리스트 추가" onPress={()=>{
          checklist=[]
          //templist =[]
          navigation.navigate("keepUpload",{mode:"write", initText:"", initTitle:"",initButton : false})}}/>
        }
        </View> 
    </View> 
  );
} 
 


var checklist = []


const offset = Platform.OS == 'ios' ? 100 : 0
const HeaderComponent = React.memo(({route, navigation}) =>{

  const [title,setTitle] = useState(route.params.initTitle);
  const [text, setText] = useState(route.params.initText);
  const [preventUp, setPreventUp] = useState(route.params.initButton); //일단 업로드만실험해볼것.
  const [preventDel, setPreventDel] = useState(route.params.initButton);
  const update = useForceUpdate();
  ///console.log("prevent!!!",prevent)

  React.useEffect(()=>{
   // console.log("upload useeffect!!")
    if(preventUp){
      if((KeepData.length) >= 100) Alert.alert("","메모가 너무 많습니다. 더 이상 메모를 만들 수 없습니다.")
      else{
        if(route.params.mode == "write"){
          var today = new Date().getTime();
          KeepData.push({id:today, title:title, text:text, checklist : checklist});
          //realMemoLen +=1;

        }  
        else{
         // console.log("변경중...")
         // console.log("befor",KeepData[route.params.mode])

          var tempid= KeepData[route.params.mode].id 
          //KeepData[route.params.mode].title = title;
          //KeepData[route.params.mode].text = text;
          //KeepData[route.params.mode].checklist = checklist;
          //var tempcheck=JSON.stringify(checklist)
          KeepData[route.params.mode] ={id:tempid, title:title, text: text, checklist:checklist.slice()}
         // console.log("after",KeepData[route.params.mode])
          }
      }  
      checklist = [];
      //templist = [];
    // route.params.keep({refresh:true})
      refresh = true;
   
      navigation.goBack();
    }
 
    if(preventDel){
      //console.log("삭제전", KeepData.length);
      //console.log(route.params.mode)
      //var tempid = KeepData[route.params.mode].id
      //KeepData[route.params.mode]={id:tempid, delete: true}
      //realMemoLen -= 1;
      KeepData.splice(route.params.mode,1)
      checklist=[];
      //templist =[];
      //route.params.keep({refresh:true})
      refresh = true;
     // console.log("삭제후", KeepData.length)
      navigation.goBack(); 

    }
  },[preventUp,preventDel])


  return(
        <Fragment>
        <View style={{flex:1 ,marginTop:Platform.OS === 'ios'? '15%' : 40, marginHorizontal:10 , bottom: Platform.OS === 'ios'? '3%': 0,
        flexDirection:'row',justifyContent:'space-between'}}>
          <View style = {{flexDirection: 'row'}}>
          <TouchableOpacity  style={{alignSelf:'center'}}
          onPress= {()=>{ 
            checklist = [];
            //templist = [];
            //console.log("뒤로가기 ㅜㄴ럴ㅆ다고", checklist)
           // route.params.keep({refresh:false})
             navigation.goBack()}}
           > 
             <AntDesign name="closecircle" size={30} color="dodgerblue" />
           </TouchableOpacity>
        <Text style={{fontSize:25, marginLeft:10}}>체크리스트 추가</Text>
        </View> 
          <View style={{flexDirection:'row'}}>
          { route.params.mode != "write"?
          <View style={{marginHorizontal:10}}>
          <Button 
          title="삭제"
          disabled ={preventDel}
          onPress={() =>{
            if(!preventDel) setPreventDel(true)
          }} />
          </View> 
          : 
          (null)
          }
          <Button title="저장"  
          disabled={preventUp}
          onPress={() =>{ //checklist추가예정.
            if(!preventUp) setPreventUp(true)  
          }} />
          </View>
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
          blurOnSubmit={true}
          numberOfLines={2}
          maxLength={textLen}
          value={text}
           />
        </View> 
        </Fragment>

  )

});

export const KeepUpload = ({route,navigation}) => {
  //console.log("KeepUpload!!!!",route.params.mode);
  //console.log(checklist)
  const update = useForceUpdate();
  return( 
    <Fragment>
   <FlatList
   removeClippedSubviews={false} 
   style={{flex:1}}
    keyExtractor={(memo)=>memo.id.toString()}
   data = {checklist}
   renderItem = {(memo) => {
    return <ListItem memo={memo} reload={update}/>
  }}
  windowSize={2}
  onEndReached={()=>{//console.log("끝!!");

    }}
 
   onEndReachedThreshold={0.1}
   ListHeaderComponent={<HeaderComponent route={{...route}} navigation={navigation}/>}
    bounces={false}
   />
  <KeyboardAvoidingView style={{
    justifyContent:'flex-end',
    marginHorizontal:10, 
    marginBottom:Platform.OS === 'ios'? '10%' : 10 
    }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <TouchableOpacity  
    onPress= {()=>{
       var today = new Date().getTime();
      if(checklist.length >= 50)Alert.alert("","체크리스트가 너무 많습니다. 더 이상 체크리스트를 만들 수 없습니다.")
      else{
      checklist.push({id:today,text:"",toggle:false}) 
      //templist.push({id:today,text:"",toggle:false})
       update();
      }
      }}
     >
       <AntDesign name="plussquareo" size={30} color="black" />
     </TouchableOpacity>
  </KeyboardAvoidingView>
  </Fragment>
  );
}
   


const ListItem = React.memo(({memo,reload}) =>{ //나중에 매개변수받아야함.
  //console.log("ListItem", memo.index)
  //console.log(checklist)
  const [toggle, setToggle] = useState(memo.item.toggle) 
  const [text, setText] = useState(memo.item.text)

   
  return(

  <View style={{flexDirection:'row',marginTop:15,marginHorizontal:10}}> 
  <View style={{flexDirection:'row',flex:1,justifyContent:'space-between'}}>
  <TouchableOpacity onPress={()=>{ 
        if(toggle){

          checklist[memo.index]  = {id:memo.item.id, text:text, toggle:false};
          //[index]  = {id:checklist[index].id, text:checklist[index].text, toggle:false}
          setToggle(false)}
        else{
          checklist[memo.index] = {id:memo.item.id, text:text, toggle:true};
          //templist[index]= {id:checklist[index].id, text:checklist[index].text, toggle:false}
          setToggle(true)}}}
      style={{flex:0.1}}
          >
  {toggle ?
  <Feather name="check-circle" size={24} color="gray" />
  :
  <Entypo name="circle" size={24} color="black" />
  } 
  </TouchableOpacity>
  <View style={{flex:1}}>
  {toggle ? 
  
  <Text style={{textDecorationLine:'line-through',color : 'gray',fontSize:20, width:'90%' }}>{text}</Text>
  : 
  <TextInput 
  style={{fontSize:20}}
  placeholder="내용을 입력하세요."
  multiline
  scrollEnabled={false}
  blurOnSubmit={true}
  value={text} 

  keyboardDismissMode='none'
  removeClippedSubviews={false}

  onChangeText={(val)=>{
    //templist[index].text = val;
    checklist[memo.index]={id:memo.item.id, text:val, toggle:toggle}
    setText(val)
  }}
  maxLength={checkLen}
  /> 
  }   
  </View> 
  </View>
  <View style={{width:'7%'}} >
  {toggle ?
   <TouchableOpacity onPress={()=>{
    checklist.splice(memo.index,1);
    //templist.splice(index,1);
    reload();
     }}
     >
    <AntDesign name="close" size={24} color="black" />
   </TouchableOpacity> 
   :
   (null)
  }
  </View>
  </View>

  );
  
},areEqual)

  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start' // if you want to fill rows left to right
  },
  item: { 
    width: '50%', // is 50% of container width 
  },
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
})