import { Appbar, IconButton, Text, useTheme } from 'react-native-paper';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/core';
import { Col, Row, Grid } from 'react-native-easy-grid';

import { ClickableDartboard } from '~/components/ClickableDartboard/ClickableDartboard';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '#/navigation';
import { RouteProp } from '@react-navigation/native';
import { makeStyles } from './styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserService } from '~/services/user_service';

interface ScoreRow {
  id: string;
  name: string;
  last: number;
  avg: number;
  validAvg: number;
  score: number;
}

export const PlayGameScreen: React.FC<any> = () => {
  const [scoreTableData, setScoreTableData] = React.useState<ScoreRow[]>([]);
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PLAY_GAME'>>();
  const { colors } = useTheme();
  const { width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const styles = makeStyles();
  const iconSize = Math.max(width * 0.04, 24);

  React.useEffect(() => {
    const scoreData: ScoreRow[] = [];
    route.params.selectedUsers
      .reduce<Promise<unknown>>((previousPromise, nextID) => {
        return previousPromise.then(async () => {
          const user = await new UserService().getById(nextID);
          scoreData.push({
            id: user.id,
            name: user.name,
            last: 0,
            avg: 0.0,
            validAvg: 0.0,
            score: 501,
          });
          scoreData.push({
            id: `${user.id}1`,
            name: user.name,
            last: 0,
            avg: 0.0,
            validAvg: 0.0,
            score: 501,
          });
          scoreData.push({
            id: `${user.id}2`,
            name: user.name,
            last: 0,
            avg: 0.0,
            validAvg: 0.0,
            score: 501,
          });
          scoreData.push({
            id: `${user.id}3`,
            name: user.name,
            last: 0,
            avg: 0.0,
            validAvg: 0.0,
            score: 501,
          });
          scoreData.push({
            id: `${user.id}4`,
            name: user.name,
            last: 0,
            avg: 0.0,
            validAvg: 0.0,
            score: 501,
          });
          scoreData.push({
            id: `${user.id}5`,
            name: user.name,
            last: 0,
            avg: 0.0,
            validAvg: 0.0,
            score: 501,
          });
        });
      }, Promise.resolve())
      .then(() => {
        setScoreTableData(scoreData);
      });
  }, [route]);

  return (
    <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
      <View style={styles.content}>
        <Pressable onPress={() => console.log('out')}>
          <View style={styles.dartboardWrapper}>
            <View>
              <ClickableDartboard onClick={console.log} />
              <Text style={styles.missText}>MISS</Text>
            </View>
          </View>
        </Pressable>
        <SafeAreaView style={styles.scoreWrapper}>
          <View style={styles.scoreContainer}>
            <View style={styles.currentTurnScoreContainer}>
              <View style={styles.currentThrowContainer}>
                <Text style={styles.currentThrowNumberText}>1</Text>
                <Text style={styles.currentThrowNumberTextSuperScript}>st</Text>
                <Text style={styles.currentThrowScoreText}>-</Text>
              </View>
              <View style={styles.currentThrowContainer}>
                <Text style={styles.currentThrowNumberText}>2</Text>
                <Text style={styles.currentThrowNumberTextSuperScript}>nd</Text>
                <Text style={styles.currentThrowScoreText}>-</Text>
              </View>
              <View style={styles.currentThrowContainer}>
                <Text style={styles.currentThrowNumberText}>3</Text>
                <Text style={styles.currentThrowNumberTextSuperScript}>rd</Text>
                <Text style={styles.currentThrowScoreText}>-</Text>
              </View>
              <IconButton
                icon="restore"
                size={iconSize}
                color={colors.primary}
                style={[
                  styles.undoButton,
                  {
                    paddingRight: iconSize * 0.067,
                  },
                ]}
              />
            </View>
            <Grid style={styles.scoreTable}>
              <Row style={[styles.scoreTableRow, styles.scoreTableHead]}>
                <Col size={3}>
                  <Text
                    style={[styles.scoreTableCell, styles.scoreTableBoldCell]}>
                    Name
                  </Text>
                </Col>
                <Col size={1}>
                  <Text
                    style={[
                      styles.scoreTableCell,
                      styles.scoreTableCenterCell,
                    ]}>
                    Last
                  </Text>
                </Col>
                <Col size={1}>
                  <Text
                    style={[
                      styles.scoreTableCell,
                      styles.scoreTableCenterCell,
                    ]}>
                    Avg
                  </Text>
                </Col>
                <Col size={1.5}>
                  <Text
                    style={[
                      styles.scoreTableCell,
                      styles.scoreTableCenterCell,
                    ]}>
                    Valid Avg
                  </Text>
                </Col>
                <Col size={1}>
                  <Text
                    style={[
                      styles.scoreTableCell,
                      styles.scoreTableBoldCell,
                      styles.scoreTableCenterCell,
                    ]}>
                    Score
                  </Text>
                </Col>
              </Row>
              <ScrollView>
                {scoreTableData.map(score => (
                  <Row style={styles.scoreTableRow} key={score.id}>
                    <Col size={3}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.scoreTableCell,
                          styles.scoreTableBoldCell,
                        ]}>
                        {score.name}
                      </Text>
                    </Col>
                    <Col size={1}>
                      <Text
                        style={[
                          styles.scoreTableCell,
                          styles.scoreTableCenterCell,
                        ]}>
                        {score.last}
                      </Text>
                    </Col>
                    <Col size={1}>
                      <Text
                        style={[
                          styles.scoreTableCell,
                          styles.scoreTableCenterCell,
                        ]}>
                        {score.avg}
                      </Text>
                    </Col>
                    <Col size={1.5}>
                      <Text
                        style={[
                          styles.scoreTableCell,
                          styles.scoreTableCenterCell,
                        ]}>
                        {score.validAvg}
                      </Text>
                    </Col>
                    <Col size={1}>
                      <Text
                        style={[
                          styles.scoreTableCell,
                          styles.scoreTableBoldCell,
                          styles.scoreTableCenterCell,
                        ]}>
                        {score.score}
                      </Text>
                    </Col>
                  </Row>
                ))}
              </ScrollView>
            </Grid>
          </View>
        </SafeAreaView>
      </View>
      <View style={[styles.backButton, { top: insets.top }]}>
        <Appbar.BackAction color={colors.primary} onPress={navigator.goBack} />
      </View>
    </FullScreenLayout>
  );
};
