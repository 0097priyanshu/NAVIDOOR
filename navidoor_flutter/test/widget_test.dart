import 'package:flutter_test/flutter_test.dart';
import 'package:navidoor_flutter/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('NavidoorApp mounts and displays role options', (WidgetTester tester) async {
    await tester.pumpWidget(const NavidoorApp());
    await tester.pump();
    expect(find.text('NAVIDOOR'), findsOneWidget);
    expect(find.text('I NEED ASSISTANCE'), findsOneWidget);
    expect(find.text('I AM A FAMILY CAREGIVER'), findsOneWidget);
  });
}
