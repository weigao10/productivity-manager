import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import momentFormat from 'moment-duration-format';
import clone from 'clone';
import { DragSource } from 'react-dnd';

import { ItemTypes } from '../../constants.js';

import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import RaisedButton from 'material-ui/RaisedButton';

const cardSource = {
  beginDrag(props) {
    return {
      activity: props.activity,
      oldCategory: props.category
    };
  }
};

const collect = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }
}

const ActivityCard = (props) => {
  const { activity, category, deleteActivity, index, preferences, user, affirmCategorization } = props;
  
  let formattedDuration = moment.duration(activity.duration, "seconds").format("h[h], m[m] s[s]");

  let styleTick = {
    font: 'Arial', 
    //background: '#E8F5E9', 
    background: '#DDD',
    padding: '10px 5px 10px 5px',
    margin: '10px 0px 10px 0px',
    textAlign: 'left',
    color: 'black',
    fontSize: '80%',
  };

  let styleTock = {
    font: 'Arial', 
    // background: '#C8E6C9', 
    background: '#BBB',
    padding: '10px 5px 10px 5px',
    margin: '10px 0px 10px 0px',
    textAlign: 'left',
    color: 'black',
    fontSize: '80%',
  };
  const { connectDragSource, isDragging } = props;

  let isTracked;
  if (preferences.trackedApps.includes(activity.app)) {
    isTracked = true;
  } else {
    isTracked = false;
  }

    return connectDragSource(
      <div><Paper
        key={activity.title + index}
        style={index % 2 === 0 ? styleTick : styleTock}
      >
        <b>{activity.app}</b> <br/>
        {activity.productivity.source === 'ml' ? <span>SUGGESTED BY ML<br/></span> : null}
        {isTracked ? activity.title : ''} <br/>
        <i>{formattedDuration}</i>
        <br/>
        <button onClick={() => {deleteActivity(activity, category, isTracked, user)}}>delete</button>
    {activity.productivity.source === 'ml' ? (
      <button onClick={() => {affirmCategorization(activity, category, isTracked, user)}}>THANKS ML!
    </button>) : null}
      </Paper></div>
    )
}

ActivityCard.propTypes = {
  activity: (props, propName, componentName) => {
    if (typeof props.activity.productivity !== 'object') {
      console.log('custom error incoming for activity', props.activity)
      return new Error(`
        Required prop "productivity" was not an object, instead it was ${props.activity.productivity}
      `)
    }
  }
};

export default DragSource(ItemTypes.CARD, cardSource, collect)(ActivityCard);