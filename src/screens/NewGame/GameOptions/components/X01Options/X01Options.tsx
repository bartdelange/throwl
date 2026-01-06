import { FC, useCallback } from 'react';
import { View } from 'react-native';
import { Col, Row } from 'react-native-easy-grid';
import { X01Options } from '~/models/game.ts';
import { useStyles } from './X01Options.styles.ts';
import { Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface X01OptionsProps {
  saveOptions: (options: X01Options) => void;
  options: X01Options;
}
export const X01OptionsView: FC<X01OptionsProps> = ({ saveOptions, options }) => {
  const styles = useStyles();
  const gameStartingScore = options.startingScore;
  const setGameStartingScore = useCallback(
    (newScore: number | ((current: number) => number)) => {
      const newState = typeof newScore === 'number' ? newScore : newScore(options.startingScore);

      saveOptions({
        mode: 'x01',
        startingScore: newState,
      });
    },
    [options.startingScore, saveOptions],
  );

  return (
    <View>
      <Text style={styles.startingScoreTitle}>Pick starting score</Text>
      <View style={styles.scoreInput}>
        <Row>
          <Col size={2}>
            <View style={styles.scoreButton}>
              <Text style={styles.scoreButtonText}>{gameStartingScore}</Text>
            </View>
          </Col>
          <Col size={1}>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}`.slice(0, -1))}
            >
              <MaterialCommunityIcons style={styles.scoreRemoveButton} name="backspace-outline" />
            </TouchableRipple>
          </Col>
        </Row>
        <Row>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}1`)}
            >
              <Text style={styles.scoreButtonText}>1</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}2`)}
            >
              <Text style={styles.scoreButtonText}>2</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}3`)}
            >
              <Text style={styles.scoreButtonText}>3</Text>
            </TouchableRipple>
          </Col>
        </Row>
        <Row>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}4`)}
            >
              <Text style={styles.scoreButtonText}>4</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}5`)}
            >
              <Text style={styles.scoreButtonText}>5</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}6`)}
            >
              <Text style={styles.scoreButtonText}>6</Text>
            </TouchableRipple>
          </Col>
        </Row>
        <Row>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}7`)}
            >
              <Text style={styles.scoreButtonText}>7</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}8`)}
            >
              <Text style={styles.scoreButtonText}>8</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}9`)}
            >
              <Text style={styles.scoreButtonText}>9</Text>
            </TouchableRipple>
          </Col>
        </Row>
        <Row>
          <Col>
            <TouchableRipple style={styles.scoreButton} onPress={() => setGameStartingScore(501)}>
              <Text style={styles.scoreButtonText}>501</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple
              style={styles.scoreButton}
              onPress={() => setGameStartingScore(current => +`${current}0`)}
            >
              <Text style={styles.scoreButtonText}>0</Text>
            </TouchableRipple>
          </Col>
          <Col>
            <TouchableRipple style={styles.scoreButton} onPress={() => setGameStartingScore(301)}>
              <Text style={styles.scoreButtonText}>301</Text>
            </TouchableRipple>
          </Col>
        </Row>
      </View>
    </View>
  );
};
