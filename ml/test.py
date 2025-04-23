from flask import Flask, request, jsonify
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB
import numpy as np

app = Flask(__name__)

def prepare_data(data):
    df = pd.DataFrame(data['data'], columns=['Deger', 'Kategori'])
    le_kategori = LabelEncoder()
    df['Kategori_encoded'] = le_kategori.fit_transform(df['Kategori'])
    return df, le_kategori

def predict_with_model(df, le_kategori, model):
    X = df[['Deger']]
    y = df['Kategori_encoded']
    model.fit(X, y)
    unique_values = sorted(df['Deger'].unique(), reverse=True)
    predicted_categories_encoded = model.predict(pd.DataFrame(unique_values, columns=['Deger']))
    predicted_categories = le_kategori.inverse_transform(predicted_categories_encoded)
    return {str(value): category for value, category in zip(unique_values, predicted_categories)}

@app.route('/predict_decision_tree', methods=['POST'])
def predict_decision_tree():
    data = request.get_json()
    df, le_kategori = prepare_data(data)
    model = DecisionTreeClassifier()
    result = predict_with_model(df, le_kategori, model)
    return jsonify(result)

@app.route('/predict_knn', methods=['POST'])
def predict_knn():
    data = request.get_json()
    df, le_kategori = prepare_data(data)
    model = KNeighborsClassifier(n_neighbors=3)
    result = predict_with_model(df, le_kategori, model)
    return jsonify(result)

@app.route('/predict_svm', methods=['POST'])
def predict_svm():
    data = request.get_json()
    df, le_kategori = prepare_data(data)
    model = SVC()
    result = predict_with_model(df, le_kategori, model)
    return jsonify(result)

@app.route('/predict_random_forest', methods=['POST'])
def predict_random_forest():
    data = request.get_json()
    df, le_kategori = prepare_data(data)
    model = RandomForestClassifier()
    result = predict_with_model(df, le_kategori, model)
    return jsonify(result)

@app.route('/predict_naive_bayes', methods=['POST'])
def predict_naive_bayes():
    data = request.get_json()
    df, le_kategori = prepare_data(data)
    model = GaussianNB()
    result = predict_with_model(df, le_kategori, model)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)