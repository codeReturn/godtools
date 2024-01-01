import React, {useReducer, useEffect, useCallback, useMemo} from 'react';

import { validate } from '../../util/validators';

const inputReducer = (state, action) => {
  switch (action.type) {
    case 'CHANGE':
      return {
        ...state,
        value: action.val,
        isValid: validate(action.val, action.validators)
      };
    case 'TOUCH': {
      return {
        ...state,
        isTouched: true
      };
    }
    case 'RESET': {
      return {
        ...action.payload
      }
    }
    default:
      return state;
  }
};

const Input = props => {
  const initialState = useMemo(() => ({
    value: props.initialValue || '',
    isTouched: false,
    isValid: props.initialValid || false
  }), [props.initialValue, props.initialValid]);
  const [inputState, dispatch] = useReducer(inputReducer, initialState);

  const { id, onInput } = props;
  const { value, isValid } = inputState;

  useEffect(() => {
    onInput(id, value, isValid);
  }, [id, value, isValid, onInput]);
  
  const resetHandler = useCallback(() => {
    dispatch({
      type: 'RESET',
      payload: initialState
    })
  }, [dispatch, initialState]);
  
  useEffect(() => {
    if (props.setResetHandler) props.setResetHandler(resetHandler);
  }, [props.setResetHandler, resetHandler]);

  const changeHandler = event => {
    dispatch({
      type: 'CHANGE',
      val: event.target.value,
      validators: props.validators
    });
  };

  const touchHandler = () => {
    dispatch({
      type: 'TOUCH'
    });
  };

  const element =
    props.element === 'input' ? (
      <input
        id={props.id}
        type={props.type}
        placeholder={props.placeholder}
        onChange={changeHandler}
        onBlur={touchHandler}
        value={inputState.value}
        className="form-control"
      />
    ) : (
      <textarea
        id={props.id}
        rows={props.rows || 3}
        onChange={changeHandler}
        onBlur={touchHandler}
        value={inputState.value}
        className="form-control"
      />
    );

  return (
    <div
      className={`mb-3 ${!inputState.isValid &&
        inputState.isTouched &&
        'form-invalid'}`}
    >
      <label htmlFor={props.id} className="form-label">{props.label}</label>
      {element}
      
      <span className="error-text">
      {!inputState.isValid && inputState.isTouched && <p>{props.errorText}</p>}
      </span>
    </div>
  );
};

export default Input;
