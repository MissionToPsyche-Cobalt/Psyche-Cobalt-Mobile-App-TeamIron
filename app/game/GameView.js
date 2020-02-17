import React from 'react';
import { View, StatusBar, ImageBackground } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';

// Components
import LoadingModal from './components/LoadingModal';
import NavigationModal from './components/NavigationModal';
import GameOverModal from './components/GameOverModal';
import BottomBar from './components/BottomBar';
import TopBar from './components/TopBar';

// Game Engine
import { ENGINE, WORLD } from './engine/init';
import {
  PsycheRover,
  PsycheRover_Matter
} from './engine/renderers/PsycheRover';

// GAME ENGINE :: SYSTEMS
import { Physics } from './engine/systems/matter.js';
import {
  DeployAsteroids,
  DestroyAsteroids,
  RemoveAsteroids,
  MoveAsteroids,
  RemoveCollidedAsteroids
} from './engine/systems/dangerAsteroids.js';
import {
  DeployClearScreens,
  RemoveClearScreens,
  AddPowerUpClearScreens,
  ClearScreensEffect,
  MoveClearScreens
} from './engine/systems/powerupClearScreens.js';
import {
  DeployHealths,
  RemoveHealths,
  AddPowerUpHealths,
  MoveHealths
} from './engine/systems/powerupHealths.js';

import {
  DeployClocks,
  RemoveClocks,
  AddPowerUpClocks,
  MoveClocks
} from './engine/systems/powerupClocks.js';

export default class GameView extends React.Component {
  constructor(props) {
    super(props);
    this._engineRef = null;
  }
  state = {
    running: true,
    imageLoaded: true,
    health: 100,
    score: 0,
    navigationModalVisible: false,
    gameOverModalVisible: false,
    systems: [
      Physics,
      DeployAsteroids,
      DestroyAsteroids,
      RemoveAsteroids,
      MoveAsteroids,
      RemoveCollidedAsteroids,
      DeployClearScreens,
      RemoveClearScreens,
      AddPowerUpClearScreens,
      ClearScreensEffect,
      MoveClearScreens,
      DeployHealths,
      RemoveHealths,
      AddPowerUpHealths,
      MoveHealths,
      DeployClocks,
      RemoveClocks,
      AddPowerUpClocks,
      MoveClocks
    ],
    powerUps: ['empty', 'clock', 'empty']
  };
  _isMounted = false;

  componentDidMount() {
    this._isMounted = true;
    this.reset();
    Matter.Events.on(ENGINE, 'collisionStart', e => {
      if (!e.pairs[0].bodyA.isStatic) {
        if (this._engineRef)
          this._engineRef.dispatch({
            type: 'asteroidCollision',
            id: e.pairs[0].bodyA.id
          });
      } else if (!e.pairs[0].bodyB.isStatic) {
        if (this._engineRef)
          this._engineRef.dispatch({
            type: 'asteroidCollision',
            id: e.pairs[0].bodyB.id
          });
      }
      if (this._isMounted && this.state.health !== undefined) {
        let newHealth = this.state.health - 10;
        if (this.state.health !== 0) {
          if (newHealth >= 0) {
            this.setState({ health: newHealth });
          } else {
            this.setState({ health: 0 });
          }
        }
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.health !== prevState.health) {
      if (this.state.health === 0) {
        // TEMPORARY WORKAROUND, STOP/RUNNING DOESN'T WORK
        this.setState({ running: false }, () => {
          this.stopEngine();
          this.setGameOverModalVisible(true);
        });
      }
    }
  }

  setEngineRef = classRef => {
    this._engineRef = classRef;
  };

  stopEngine = () => {
    if (this._engineRef) this._engineRef.stop();
  };

  componentWillUnmount() {
    // TODO: This is an anti-pattern, need to handle clearing Matter instances correctly
    Matter.World.clear(WORLD);
    Matter.Engine.clear(ENGINE);
    this._isMounted = false;
  }

  // View Handlers
  setNavigationModalVisible = visible => {
    this.setState({ navigationModalVisible: visible });
  };

  setGameOverModalVisible = visible => {
    this.setState({ gameOverModalVisible: visible });
  };

  handleGameReset = () => {
    this.reset();
  };

  // GameEngine Handlers
  onEvent = e => {
    // console.log('EVENT: ', e);
    if (e.type === 'game-over') {
      if (this._isMounted) {
        this.setState({ running: false });
      }
    } else if (e.type === 'addPowerUpClearScreens') {
      for (const powerUpIndex in this.state.powerUps) {
        if (this.state.powerUps[powerUpIndex] === 'empty') {
          let powerUps = this.state.powerUps;
          powerUps.splice(powerUpIndex, 1, 'clearScreen');
          this.setState({ powerUps: powerUps });
          return;
        }
      }
    } else if (e.type === 'addPowerUpClocks') {
      for (const powerUpIndex in this.state.powerUps) {
        if (this.state.powerUps[powerUpIndex] === 'empty') {
          let powerUps = this.state.powerUps;
          powerUps.splice(powerUpIndex, 1, 'clock');
          this.setState({ powerUps: powerUps });
          return;
        }
      }
    } else if (e.type === 'addPowerUpHealths') {
      for (const powerUpIndex in this.state.powerUps) {
        if (this.state.powerUps[powerUpIndex] === 'empty') {
          let powerUps = this.state.powerUps;
          powerUps.splice(powerUpIndex, 1, 'health');
          this.setState({ powerUps: powerUps });
          return;
        }
      }
    } else if (e.type === 'activateClearScreen') {
      let powerUps = this.state.powerUps;
      powerUps.splice(e.index, 1, 'empty');
      this.setState({ powerUps: powerUps }, () => {
        this._engineRef.dispatch({ type: 'effectClearScreens' });
        // console.log('ACTIVATED POWERUP CLEAR SCREEN');
      });
    } else if (e.type === 'activateClock') {
      let powerUps = this.state.powerUps;
      powerUps.splice(e.index, 1, 'empty');
      this.setState({ powerUps: powerUps }, () => {
        this._engineRef.dispatch({ type: 'effectClock' });
        // console.log('ACTIVATED POWERUP CLOCK');
      });
    } else if (e.type === 'activateHealth') {
      let powerUps = this.state.powerUps;
      powerUps.splice(e.index, 1, 'empty');
      this.setState({ powerUps: powerUps }, () => {
        // this._engineRef.dispatch({type: ''});
        let newHealth = 0;
        if (this.state.health + 10 <= 100) {
          newHealth = this.state.health + 10;
        } else if (this.state.health + 10 > 100) {
          newHealth = 100;
        }
        this.setState({ health: newHealth });
        // console.log('ACTIVATED POWERUP HEALTH');
      });
    } else if (e.type === 'destroyAsteroid') {
      const newScore = this.state.score + 10;
      this.setState({ score: newScore });
    }
  };

  reset = () => {
    Matter.World.clear(WORLD);
    Matter.Engine.clear(ENGINE);
    if (this._engineRef)
      this._engineRef.swap({
        physics: {
          engine: ENGINE,
          world: WORLD
        },
        created: {
          createdAsteroids: [],
          createdClearScreens: [],
          createdHealths: [],
          createdClocks: []
        },
        destroy: {
          destroyAsteroids: []
        },
        psycheRover: {
          body: PsycheRover_Matter,
          renderer: PsycheRover
        }
      });
    if (this._isMounted) {
      this.setState({ running: true, health: 100, score: 0 });
    }
  };

  // NOTE: FUNCTION FOR TRIGGERING EVENT
  emitEngineEvent = (event, index) => {
    this._engineRef.dispatch({ type: event, index: index });
  };
  // END: FUNCTION FOR TRIGGERING EVENT

  render() {
    return (
      <View style={styles.outerContainer}>
        <LoadingModal imageLoaded={this.state.imageLoaded} />
        <GameEngine
          ref={this.setEngineRef}
          running={this.state.running}
          style={styles.innerContainer}
          systems={this.state.systems}
          entities={{
            physics: {
              engine: ENGINE,
              world: WORLD
            },
            created: {
              createdAsteroids: [],
              createdClearScreens: [],
              createdHealths: [],
              createdClocks: []
            },
            destroy: {
              destroyAsteroids: []
            },
            psycheRover: {
              body: PsycheRover_Matter,
              renderer: PsycheRover
            }
          }}
          onEvent={this.onEvent}
        >
          <StatusBar hidden={true} />
          <NavigationModal
            modalVisible={this.state.navigationModalVisible}
            setModalVisible={this.setNavigationModalVisible}
            handleGameView={this.props.handleGameView}
          />
          <GameOverModal
            modalVisible={this.state.gameOverModalVisible}
            setModalVisible={this.setGameOverModalVisible}
            handleGameView={this.props.handleGameView}
            score={this.state.score}
            handleGameReset={this.handleGameReset}
          />
          <TopBar
            setNavigationModalVisible={this.setNavigationModalVisible}
            score={this.state.score}
          />
          <BottomBar
            health={this.state.health}
            powerUps={this.state.powerUps}
            emitEngineEvent={this.emitEngineEvent}
          />
        </GameEngine>
      </View>
    );
  }
}

const styles = {
  outerContainer: {
    flex: 1,
    backgroundColor: '#1e2223'
  },
  innerContainer: {
    flex: 1
  }
};
