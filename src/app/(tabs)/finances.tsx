import { Box, Center, Heading, Text, VStack } from '@gluestack-ui/themed';

export default function FinancesScreen() {
  return (
    <Box flex={1} backgroundColor="$white">
      <Center flex={1}>
        <VStack space="sm" alignItems="center">
          <Heading size="2xl">Finances</Heading>
          <Text color="$coolGray500">Track shared expenses and bills</Text>
        </VStack>
      </Center>
    </Box>
  );
}
